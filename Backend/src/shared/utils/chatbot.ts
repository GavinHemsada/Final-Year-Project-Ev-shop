// ============================================
// CHATBOT SERVICE
// ============================================
import { GoogleGenerativeAI } from "@google/generative-ai";
import Order from "../../entities/Order";
import { IEvRepository } from "../../modules/ev/ev.repository";
import { ListingStatus } from "../enum/enum";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface OrderData {
  total: number;
  date: Date;
  status: string;
  items?: string[];
  customer?: string;
}

export async function getChatbotResponse(
  userQuestion: string,
  evRepo?: IEvRepository
): Promise<string> {
  try {
    const question = userQuestion.toLowerCase();

    // Check if question is EV-related
    const isEvQuestion =
      question.includes("ev") ||
      question.includes("electric vehicle") ||
      question.includes("best selling") ||
      question.includes("best model") ||
      question.includes("fastest") ||
      question.includes("fast") ||
      question.includes("budget") ||
      question.includes("cheap") ||
      question.includes("affordable") ||
      question.includes("range") ||
      question.includes("battery") ||
      question.includes("charging") ||
      question.includes("model") ||
      question.includes("brand");

    if (isEvQuestion && evRepo) {
      return await handleEvQuestion(userQuestion, evRepo);
    }

    // Default to order analysis
    const orders = await Order.find({}).limit(50).sort({ order_date: -1 });

    if (orders.length === 0) {
      return "There is no order data in the database to analyze.";
    }

    // Enhanced order summary with more details
    const orderSummary: OrderData[] = orders.map((order) => ({
      total: order.total_amount,
      date: order.order_date,
      status: order.order_status,
    }));

    // Calculate aggregate statistics
    const stats = calculateStats(orderSummary);

    const prompt = `You are an expert sales analyst assistant. Analyze the data and answer questions clearly and concisely.

ORDER DATA:
${JSON.stringify(orderSummary, null, 2)}

STATISTICS:
- Total Orders: ${stats.totalOrders}
- Total Revenue: $${stats.totalRevenue.toFixed(2)}
- Average Order Value: $${stats.avgOrderValue.toFixed(2)}
- Completed Orders: ${stats.completedOrders}
- Pending Orders: ${stats.pendingOrders}
- Cancelled Orders: ${stats.cancelledOrders}

USER QUESTION: ${userQuestion}

INSTRUCTIONS:
- Provide specific numbers and insights
- Be concise but informative
- Use bullet points for lists
- Format currency values properly
- If the question cannot be answered with available data, say so clearly`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Chatbot Error:", error);
    return handleChatbotError(error);
  }
}

async function handleEvQuestion(
  userQuestion: string,
  evRepo: IEvRepository
): Promise<string> {
  try {
    // Fetch all listings and models
    const listings = await evRepo.findAllListings();
    const models = await evRepo.findAllModels();

    if (!listings || listings.length === 0) {
      return "I'm sorry, but there are currently no EV listings available in our database. Please check back later!";
    }

    // Prepare EV data for analysis
    const evData = listings
      .filter((listing) => listing.status === ListingStatus.ACTIVE)
      .map((listing: any) => {
        const model = listing.model_id;
        return {
          listing_id: listing._id.toString(),
          brand: model?.brand_id?.brand_name || "Unknown",
          model_name: model?.model_name || "Unknown",
          year: model?.year || "N/A",
          price: listing.price,
          range_km: model?.range_km || null,
          battery_capacity_kwh: model?.battery_capacity_kwh || null,
          charging_time_hours: model?.charging_time_hours || null,
          category: model?.category_id?.category_name || "N/A",
          condition: listing.condition,
          color: listing.color || "N/A",
          seller: listing.seller_id?.business_name || "Unknown Seller",
        };
      });

    // Sort and filter based on question type
    const question = userQuestion.toLowerCase();
    let relevantEvs = [...evData];
    let sortCriteria = "";

    if (question.includes("best selling") || question.includes("popular")) {
      // For best selling, we can sort by price (assuming lower price = more popular)
      // or by number of listings for the same model
      const modelCounts: { [key: string]: number } = {};
      evData.forEach((ev) => {
        const key = `${ev.brand} ${ev.model_name}`;
        modelCounts[key] = (modelCounts[key] || 0) + 1;
      });
      relevantEvs = evData
        .map((ev) => ({
          ...ev,
          popularity: modelCounts[`${ev.brand} ${ev.model_name}`] || 0,
        }))
        .sort((a: any, b: any) => b.popularity - a.popularity)
        .slice(0, 10);
      sortCriteria = "popularity (number of listings)";
    } else if (question.includes("fastest") || question.includes("fast")) {
      // Sort by range (higher range often correlates with performance)
      relevantEvs = evData
        .filter((ev) => ev.range_km !== null)
        .sort((a, b) => (b.range_km || 0) - (a.range_km || 0))
        .slice(0, 10);
      sortCriteria = "driving range";
    } else if (
      question.includes("budget") ||
      question.includes("cheap") ||
      question.includes("affordable") ||
      question.includes("lowest price")
    ) {
      // Sort by price (lowest first)
      relevantEvs = evData.sort((a, b) => a.price - b.price).slice(0, 10);
      sortCriteria = "price (lowest to highest)";
    } else if (
      question.includes("best model") ||
      question.includes("best ev")
    ) {
      // Sort by a combination of factors (range, price, battery)
      relevantEvs = evData
        .map((ev) => ({
          ...ev,
          score:
            (ev.range_km || 0) * 0.4 +
            (1000000 / (ev.price || 1)) * 0.3 +
            (ev.battery_capacity_kwh || 0) * 0.3,
        }))
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 10);
      sortCriteria = "overall value (range, price, battery)";
    } else {
      // Default: show top 10 by range
      relevantEvs = evData
        .filter((ev) => ev.range_km !== null)
        .sort((a, b) => (b.range_km || 0) - (a.range_km || 0))
        .slice(0, 10);
    }

    // Format EV data for prompt
    const evListText = relevantEvs
      .map(
        (ev, index) => `
${index + 1}. ${ev.brand} ${ev.model_name} (${ev.year})
   - Price: LKR ${ev.price.toLocaleString()}
   - Range: ${ev.range_km ? `${ev.range_km} km` : "N/A"}
   - Battery: ${
     ev.battery_capacity_kwh ? `${ev.battery_capacity_kwh} kWh` : "N/A"
   }
   - Charging Time: ${
     ev.charging_time_hours ? `${ev.charging_time_hours} hours` : "N/A"
   }
   - Category: ${ev.category}
   - Condition: ${ev.condition}
   - Seller: ${ev.seller}`
      )
      .join("\n");

    const prompt = `You are an expert EV consultant assistant for an EV marketplace. Answer the user's question about electric vehicles based on the available EV data in our database.

USER QUESTION: ${userQuestion}

AVAILABLE EV DATA (${relevantEvs.length} vehicles, sorted by ${
      sortCriteria || "relevance"
    }):
${evListText}

STATISTICS:
- Total Active Listings: ${evData.length}
- Price Range: LKR ${Math.min(...evData.map((e) => e.price))} - LKR ${Math.max(
      ...evData.map((e) => e.price)
    )}
- Average Price: LKR ${Math.round(
      evData.reduce((sum, e) => sum + e.price, 0) / evData.length
    )}
- Brands Available: ${new Set(evData.map((e) => e.brand)).size}
- Categories: ${Array.from(new Set(evData.map((e) => e.category))).join(", ")}

INSTRUCTIONS:
- Provide a comprehensive and helpful answer
- List the top recommended EVs with their key features
- Include prices in LKR (Sri Lankan Rupees)
- Mention range, battery capacity, and charging time when available
- Be friendly and informative
- Format the response with clear sections and bullet points
- If specific data is missing, mention it but still provide available information
- Make the response engaging and easy to read`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("EV Chatbot Error:", error);
    return "I encountered an error while fetching EV information. Please try again later!";
  }
}

// ============================================
//  HELPER FUNCTIONS
// ============================================
function calculateStats(orders: OrderData[]) {
  return {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
    avgOrderValue:
      orders.reduce((sum, order) => sum + order.total, 0) / orders.length,
    completedOrders: orders.filter(
      (o) => o.status.toLowerCase() === "completed"
    ).length,
    pendingOrders: orders.filter((o) => o.status.toLowerCase() === "pending")
      .length,
    cancelledOrders: orders.filter(
      (o) => o.status.toLowerCase() === "cancelled"
    ).length,
  };
}

function handleChatbotError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("429") || error.message.includes("quota")) {
      return "⚠️ Rate limit exceeded. Please wait a moment and try again.";
    }
    if (error.message.includes("404")) {
      return "⚠️ Model not found. Please check your Gemini API configuration.";
    }
    if (error.message.includes("API key")) {
      return "⚠️ Invalid API key. Please check your GEMINI_API_KEY environment variable.";
    }
    return `Error: ${error.message}`;
  }
  return "An unexpected error occurred. Please try again.";
}

// ============================================
// SUGGESTED QUESTION CATEGORIES
// ============================================
export const SUGGESTED_QUESTIONS = {
  revenue: [
    "What is the total revenue?",
    "What's the average order value?",
    "Show me revenue trends",
    "What are the top selling products?",
    "Compare this month vs last month revenue",
  ],
  orders: [
    "How many orders do we have?",
    "How many pending orders?",
    "What's the order completion rate?",
    "Show me recent orders",
    "How many orders were cancelled?",
  ],
  analytics: [
    "What are the busiest days?",
    "Show me sales performance",
    "What's the conversion rate?",
    "Identify sales trends",
    "What are peak ordering times?",
  ],
  customers: [
    "Who are our top customers?",
    "What's the customer retention rate?",
    "How many new customers this month?",
    "Show customer purchase patterns",
  ],
  forecasting: [
    "Predict next month's sales",
    "What's the projected revenue?",
    "Forecast inventory needs",
    "Estimate growth rate",
  ],
};