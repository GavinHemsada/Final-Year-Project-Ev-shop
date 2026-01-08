// ============================================
// CHATBOT SERVICE
// ============================================
import { GoogleGenerativeAI } from "@google/generative-ai";
import Order from "../../entities/Order";
import { IEvRepository } from "../../modules/ev/ev.repository";
import { ITestDriveRepository } from "../../modules/testDrive/testDrive.repository";
import { IRepairLocationRepository } from "../../modules/repairLocation/repairLocation.repository";
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
  evRepo?: IEvRepository,
  testDriveRepo?: ITestDriveRepository,
  repairLocationRepo?: IRepairLocationRepository
): Promise<string> {
  try {
    const question = userQuestion.toLowerCase();

    // Check if question is about test drive slots (creation/adding)
    const isTestDriveSlotQuestion =
      question.includes("add test drive") ||
      question.includes("create test drive") ||
      question.includes("new test drive slot") ||
      question.includes("add slot") ||
      question.includes("create slot") ||
      question.includes("test drive slot");

    if (isTestDriveSlotQuestion && testDriveRepo) {
      return handleTestDriveSlotQuestion(userQuestion, testDriveRepo, evRepo);
    }

    // Check if question is about service locations or repair locations
    const isServiceLocationQuestion =
      question.includes("service location") ||
      question.includes("repair location") ||
      question.includes("service center") ||
      question.includes("repair center") ||
      question.includes("where can i service") ||
      question.includes("where can i repair") ||
      question.includes("available services") ||
      question.includes("service locations") ||
      question.includes("repair locations");

    if (isServiceLocationQuestion && repairLocationRepo) {
      return handleServiceLocationQuestion(userQuestion, repairLocationRepo);
    }

    // Check if question is EV-related (including seller questions)
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
      question.includes("brand") ||
      question.includes("tesla") ||
      question.includes("nissan") ||
      question.includes("byd") ||
      question.includes("kia") ||
      question.includes("bmw") ||
      question.includes("vehicle") ||
      question.includes("car") ||
      question.includes("price") ||
      question.includes("cost") ||
      question.includes("seller") ||
      question.includes("sellers") ||
      question.includes("dealer") ||
      question.includes("dealers") ||
      question.includes("shop") ||
      question.includes("store") ||
      question.includes("business") ||
      question.includes("compare") ||
      question.includes("comparison") ||
      question.includes("vs") ||
      question.includes("versus") ||
      question.includes("difference");

    if (isEvQuestion) {
      if (evRepo) {
        return await handleEvQuestion(userQuestion, evRepo);
      } else {
        return "I cannot answer your question. This chatbot only provides information about electric vehicles (EVs) in our marketplace, such as models, prices, features, and specifications.\n\nPlease ask me about:\n- EV models and brands\n- Vehicle prices and features\n- Battery capacity and range\n- Available colors and conditions\n- Sellers and their listings";
      }
    }

    // Check if question is order-related
    const isOrderQuestion =
      question.includes("order") ||
      question.includes("revenue") ||
      question.includes("sales") ||
      question.includes("transaction") ||
      question.includes("purchase") ||
      question.includes("payment") ||
      question.includes("customer") ||
      question.includes("analytics") ||
      question.includes("statistics") ||
      question.includes("stat");

    // If question is neither EV-related nor order-related, return out-of-scope message
    if (!isOrderQuestion) {
      return "I cannot answer your question. This chatbot only provides information about electric vehicles (EVs) in our marketplace, such as models, prices, features, and specifications.\n\nPlease ask me about:\n- EV models and brands\n- Vehicle prices and features\n- Battery capacity and range\n- Available colors and conditions";
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
      model: "gemini-2.5-flash-lite",
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    // Clean up any markdown that might have slipped through
    text = cleanMarkdown(text);

    return text;
  } catch (error) {
    console.error("Chatbot Error:", error);
    return handleChatbotError(error);
  }
}

function handleSellerQuestion(evData: any[], userQuestion: string): string {
  // Group listings by seller
  const sellerMap = new Map<string, any[]>();
  
  evData.forEach((ev) => {
    const sellerName = ev.seller;
    if (!sellerMap.has(sellerName)) {
      sellerMap.set(sellerName, []);
    }
    sellerMap.get(sellerName)!.push(ev);
  });

  // Convert to array and sort by number of listings (best sellers first)
  const sellers = Array.from(sellerMap.entries())
    .map(([sellerName, listings]) => ({
      name: sellerName,
      listings: listings,
      count: listings.length,
    }))
    .sort((a, b) => b.count - a.count);

  if (sellers.length === 0) {
    return "I'm sorry, but there are currently no sellers with active listings in our marketplace.";
  }

  // Format seller information
  let response = "Here are the sellers in our marketplace:\n\n";
  
  sellers.forEach((seller, index) => {
    response += `${index + 1}. ${seller.name}\n`;
    response += `   Total Listings: ${seller.count}\n\n`;
    response += `   Their vehicles:\n`;
    
    seller.listings.slice(0, 5).forEach((ev: any) => {
      response += `   - ${ev.brand} ${ev.model_name} (${ev.year})\n`;
      response += `     Price: LKR ${ev.price.toLocaleString()}\n`;
      if (ev.range_km) response += `     Range: ${ev.range_km} km\n`;
      if (ev.battery_capacity_kwh) response += `     Battery: ${ev.battery_capacity_kwh} kWh\n`;
      response += `     Color: ${ev.color} | Condition: ${ev.condition}\n`;
    });
    
    if (seller.listings.length > 5) {
      response += `   ... and ${seller.listings.length - 5} more listing(s)\n`;
    }
    
    response += "\n";
  });

  // Clean up any markdown
  response = cleanMarkdown(response);
  
  return response;
}

function handleComparisonQuestion(evData: any[], userQuestion: string): string {
  // Extract model names from the question
  // Look for patterns like "Model A and Model B", "Model A vs Model B", etc.
  const question = userQuestion.toLowerCase();
  
  // Get all unique model names from the database
  const allModels = evData.map(ev => ({
    fullName: `${ev.brand} ${ev.model_name}`.toLowerCase(),
    brand: ev.brand.toLowerCase(),
    model: ev.model_name.toLowerCase(),
    data: ev
  }));
  
  // Try to extract model names from the question
  // Common patterns: "compare X and Y", "X vs Y", "X versus Y", "difference between X and Y"
  const andPattern = /compare\s+(.+?)\s+and\s+(.+?)(?:\s|$|\.|,)/i;
  const vsPattern = /(.+?)\s+(?:vs|versus)\s+(.+?)(?:\s|$|\.|,)/i;
  const betweenPattern = /(?:difference|compare|between)\s+(.+?)\s+and\s+(.+?)(?:\s|$|\.|,)/i;
  
  // Also try to extract just model names if they're mentioned (e.g., "Nissan LEAF E+" and "BYD Model 1")
  const modelNamePattern = /([A-Z][A-Za-z0-9\s+\-]+(?:\s+[A-Z][A-Za-z0-9\s+\-]+)*)/g;
  
  let model1Query = "";
  let model2Query = "";
  
  if (andPattern.test(userQuestion)) {
    const match = userQuestion.match(andPattern);
    if (match) {
      model1Query = match[1].trim().toLowerCase();
      model2Query = match[2].trim().toLowerCase();
    }
  } else if (vsPattern.test(userQuestion)) {
    const match = userQuestion.match(vsPattern);
    if (match) {
      model1Query = match[1].trim().toLowerCase();
      model2Query = match[2].trim().toLowerCase();
    }
  } else if (betweenPattern.test(userQuestion)) {
    const match = userQuestion.match(betweenPattern);
    if (match) {
      model1Query = match[1].trim().toLowerCase();
      model2Query = match[2].trim().toLowerCase();
    }
  }
  
  // If we couldn't extract, try to find two distinct model mentions
  if (!model1Query || !model2Query) {
    // Find all brand/model mentions in the question
    const brands = Array.from(new Set(evData.map(e => e.brand.toLowerCase())));
    const models = Array.from(new Set(evData.map(e => e.model_name.toLowerCase())));
    
    // Try to extract potential model names from the question (capitalized words/phrases)
    const potentialModels: string[] = [];
    const words = userQuestion.split(/\s+/);
    
    // Look for capitalized phrases that might be model names
    for (let i = 0; i < words.length; i++) {
      if (words[i][0] && words[i][0] === words[i][0].toUpperCase() && words[i][0] !== words[i][0].toLowerCase()) {
        let modelName = words[i];
        // Check if next words are also capitalized (like "LEAF E+")
        for (let j = i + 1; j < words.length; j++) {
          if (words[j][0] && (words[j][0] === words[j][0].toUpperCase() || /[0-9+]/.test(words[j]))) {
            modelName += " " + words[j];
          } else {
            break;
          }
        }
        if (modelName.length > 2) {
          potentialModels.push(modelName.toLowerCase());
        }
      }
    }
    
    const foundBrands = brands.filter(b => question.includes(b));
    const foundModels = models.filter(m => question.includes(m));
    
    // Try to construct model queries from found brands/models or potential models
    if (potentialModels.length >= 2) {
      model1Query = potentialModels[0];
      model2Query = potentialModels[1];
    } else if (foundBrands.length >= 2) {
      model1Query = foundBrands[0];
      model2Query = foundBrands[1];
    } else if (foundModels.length >= 2) {
      model1Query = foundModels[0];
      model2Query = foundModels[1];
    } else if (foundBrands.length === 1 && foundModels.length >= 1) {
      // Try to match brand + model combinations
      const brandModelPairs = evData.map(e => ({
        query: `${e.brand.toLowerCase()} ${e.model_name.toLowerCase()}`,
        data: e
      }));
      
      const matchingPairs = brandModelPairs.filter(p => question.includes(p.query));
      if (matchingPairs.length >= 2) {
        model1Query = matchingPairs[0].query;
        model2Query = matchingPairs[1].query;
      }
    } else if (potentialModels.length === 1 && foundBrands.length === 1) {
      // Try combining brand with potential model
      model1Query = `${foundBrands[0]} ${potentialModels[0]}`;
      // Try to find second model
      const remainingModels = models.filter(m => !potentialModels[0].includes(m));
      if (remainingModels.length > 0) {
        model2Query = `${foundBrands[0]} ${remainingModels[0]}`;
      }
    }
  }
  
  // Find matching models using fuzzy matching
  const findMatchingModel = (query: string) => {
    if (!query) return null;
    
    // Try exact match first
    let match = allModels.find(m => 
      m.fullName === query || 
      m.brand === query || 
      m.model === query
    );
    
    if (match) return match.data;
    
    // Try partial match (contains)
    match = allModels.find(m => 
      m.fullName.includes(query) || 
      query.includes(m.brand) || 
      query.includes(m.model) ||
      m.brand.includes(query) ||
      m.model.includes(query)
    );
    
    if (match) return match.data;
    
    // Try word-by-word matching
    const queryWords = query.split(/\s+/);
    match = allModels.find(m => {
      const fullWords = m.fullName.split(/\s+/);
      return queryWords.some(qw => fullWords.some(fw => fw.includes(qw) || qw.includes(fw)));
    });
    
    if (match) return match.data;
    
    return null;
  };
  
  const model1 = findMatchingModel(model1Query);
  const model2 = findMatchingModel(model2Query);
  
  // If we found both models, compare them
  if (model1 && model2) {
    // Get average price if multiple listings exist
    const model1Listings = evData.filter(e => 
      e.brand.toLowerCase() === model1.brand.toLowerCase() && 
      e.model_name.toLowerCase() === model1.model_name.toLowerCase()
    );
    const model2Listings = evData.filter(e => 
      e.brand.toLowerCase() === model2.brand.toLowerCase() && 
      e.model_name.toLowerCase() === model2.model_name.toLowerCase()
    );
    
    const avgPrice1 = model1Listings.length > 0 
      ? Math.round(model1Listings.reduce((sum, e) => sum + e.price, 0) / model1Listings.length)
      : model1.price;
    const avgPrice2 = model2Listings.length > 0 
      ? Math.round(model2Listings.reduce((sum, e) => sum + e.price, 0) / model2Listings.length)
      : model2.price;
    
    let response = `Comparison: ${model1.brand} ${model1.model_name} vs ${model2.brand} ${model2.model_name}\n\n`;
    
    response += `${model1.brand} ${model1.model_name} (${model1.year})\n`;
    response += `Price: LKR ${avgPrice1.toLocaleString()}\n`;
    if (model1.range_km) response += `Range: ${model1.range_km} km\n`;
    if (model1.battery_capacity_kwh) response += `Battery: ${model1.battery_capacity_kwh} kWh\n`;
    if (model1.charging_time_hours) response += `Charging Time: ${model1.charging_time_hours} hours\n`;
    response += `Category: ${model1.category}\n`;
    response += `Available Listings: ${model1Listings.length}\n\n`;
    
    response += `${model2.brand} ${model2.model_name} (${model2.year})\n`;
    response += `Price: LKR ${avgPrice2.toLocaleString()}\n`;
    if (model2.range_km) response += `Range: ${model2.range_km} km\n`;
    if (model2.battery_capacity_kwh) response += `Battery: ${model2.battery_capacity_kwh} kWh\n`;
    if (model2.charging_time_hours) response += `Charging Time: ${model2.charging_time_hours} hours\n`;
    response += `Category: ${model2.category}\n`;
    response += `Available Listings: ${model2Listings.length}\n\n`;
    
    // Add comparison summary
    response += `Key Differences:\n`;
    if (avgPrice1 !== avgPrice2) {
      const priceDiff = Math.abs(avgPrice1 - avgPrice2);
      const cheaper = avgPrice1 < avgPrice2 ? model1 : model2;
      response += `- ${cheaper.brand} ${cheaper.model_name} is LKR ${priceDiff.toLocaleString()} cheaper\n`;
    }
    if (model1.range_km && model2.range_km && model1.range_km !== model2.range_km) {
      const rangeDiff = Math.abs(model1.range_km - model2.range_km);
      const longer = model1.range_km > model2.range_km ? model1 : model2;
      response += `- ${longer.brand} ${longer.model_name} has ${rangeDiff} km more range\n`;
    }
    if (model1.battery_capacity_kwh && model2.battery_capacity_kwh && model1.battery_capacity_kwh !== model2.battery_capacity_kwh) {
      const batteryDiff = Math.abs(model1.battery_capacity_kwh - model2.battery_capacity_kwh);
      const larger = model1.battery_capacity_kwh > model2.battery_capacity_kwh ? model1 : model2;
      response += `- ${larger.brand} ${larger.model_name} has ${batteryDiff} kWh larger battery\n`;
    }
    
    response = cleanMarkdown(response);
    return response;
  }
  
  // If we only found one model
  if (model1 || model2) {
    const found = model1 || model2;
    const missing = model1 ? model2Query : model1Query;
    let response = `I found information about ${found.brand} ${found.model_name}, but I couldn't find "${missing}" in our database.\n\n`;
    response += `Here's what I have for ${found.brand} ${found.model_name}:\n\n`;
    response += `Price: LKR ${found.price.toLocaleString()}\n`;
    if (found.range_km) response += `Range: ${found.range_km} km\n`;
    if (found.battery_capacity_kwh) response += `Battery: ${found.battery_capacity_kwh} kWh\n`;
    if (found.charging_time_hours) response += `Charging Time: ${found.charging_time_hours} hours\n`;
    response += `Category: ${found.category}\n`;
    response += `\nPlease check the model name and try again, or ask about available models.`;
    response = cleanMarkdown(response);
    return response;
  }
  
  // If we found neither model
  let response = `I couldn't find the models you mentioned in our database. `;
  response += `Please check the model names and try again.\n\n`;
  response += `You can ask me about available models, brands, or specific vehicles in our marketplace.`;
  response = cleanMarkdown(response);
  return response;
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

    // Filter EVs based on keywords in the question (Brand, Category, Model)
    const question = userQuestion.toLowerCase();
    
    // Check if question is about sellers
    const isSellerQuestion = 
      question.includes("seller") ||
      question.includes("sellers") ||
      question.includes("dealer") ||
      question.includes("dealers") ||
      question.includes("best seller") ||
      question.includes("who are") ||
      question.includes("selling items") ||
      question.includes("seller's") ||
      question.includes("sellers'");
    
    if (isSellerQuestion) {
      return handleSellerQuestion(evData, userQuestion);
    }
    
    // Check if question is about comparing models
    const isComparisonQuestion = 
      question.includes("compare") ||
      question.includes("comparison") ||
      question.includes(" vs ") ||
      question.includes("versus") ||
      question.includes("difference") ||
      question.includes("between");
    
    if (isComparisonQuestion) {
      return handleComparisonQuestion(evData, userQuestion);
    }
    const uniqueBrands = Array.from(new Set(evData.map((e) => e.brand.toLowerCase())));
    const uniqueCategories = Array.from(new Set(evData.map((e) => e.category.toLowerCase())));
    
    let filteredEvs = evData.filter((ev) => {
      // Check for Brand match
      const brandInQuestion = uniqueBrands.find((b) => question.includes(b));
      if (brandInQuestion && ev.brand.toLowerCase() !== brandInQuestion) {
        return false;
      }
      
      // Check for Category match (e.g., "suv", "sedan")
      const categoryInQuestion = uniqueCategories.find((c) => question.includes(c));
      if (categoryInQuestion && ev.category.toLowerCase() !== categoryInQuestion) {
        return false;
      }

      // Check for specific model name match if not covered by brand
      // Simple check: if a model name word is in question
      // This might be too aggressive, skipping for now to rely on Brand/Category primarily.
      
      return true;
    });

    // If no specific filters matched (or filtering resulted in 0, though unlikely if keywords found), 
    // fall back to all data if the filter was too strict? 
    // No, if user asks for "Toyota" and we have none, we should show none.
    
    // Sort and filter based on question type
    let relevantEvs = [...filteredEvs];
    let sortCriteria = "";

    if (question.includes("best selling") || question.includes("popular") || question.includes("most selling")) {
      // For best selling, we can sort by popularity (listing count as proxy)
      const modelCounts: { [key: string]: number } = {};
      evData.forEach((ev) => {
        const key = `${ev.brand} ${ev.model_name}`;
        modelCounts[key] = (modelCounts[key] || 0) + 1;
      });
      relevantEvs = filteredEvs
        .map((ev) => ({
          ...ev,
          popularity: modelCounts[`${ev.brand} ${ev.model_name}`] || 0,
        }))
        .sort((a: any, b: any) => b.popularity - a.popularity)
      .slice(0, 5);
      sortCriteria = "popularity";
    } else if (question.includes("fastest") || question.includes("fast")) {
      // Sort by range
      relevantEvs = filteredEvs
        .filter((ev) => ev.range_km !== null)
        .sort((a, b) => (b.range_km || 0) - (a.range_km || 0))
        .slice(0, 5);
      sortCriteria = "driving range";
    } else if (
      question.includes("budget") ||
      question.includes("cheap") ||
      question.includes("affordable") ||
      question.includes("lowest price") ||
      question.includes("low price")
    ) {
      // Sort by price (lowest first)
      relevantEvs = filteredEvs.sort((a, b) => a.price - b.price).slice(0, 5);
      sortCriteria = "price";
    } else if (
      question.includes("best model") ||
      question.includes("best ev")
    ) {
      // Sort by score
      relevantEvs = filteredEvs
        .map((ev) => ({
          ...ev,
          score:
            (ev.range_km || 0) * 0.4 +
            (1000000 / (ev.price || 1)) * 0.3 +
            (ev.battery_capacity_kwh || 0) * 0.3,
        }))
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 5);
      sortCriteria = "overall value";
    } else {
      // Default: show top 5 by range
      relevantEvs = filteredEvs
        .sort((a, b) => (b.range_km || 0) - (a.range_km || 0))
        .slice(0, 5);
    }

    // Format EV data for prompt (Clear and readable format)
    const evListText = relevantEvs
      .map(
        (ev, index) =>
          `${index + 1}. ${ev.brand} ${ev.model_name} (${ev.year})
   Price: LKR ${ev.price.toLocaleString()}
   Range: ${ev.range_km || 'N/A'} km
   Battery: ${ev.battery_capacity_kwh || 'N/A'} kWh
   Color: ${ev.color}
   Condition: ${ev.condition}`
      )
      .join("\n\n");

    const prompt = `You are an expert EV consultant assistant for an EV marketplace. Answer the user's question about electric vehicles based on the available EV data in our database.

USER QUESTION: ${userQuestion}

AVAILABLE EV DATA (${relevantEvs.length} vehicles matching criteria, sorted by ${
      sortCriteria || "relevance"
    }):
${evListText}

STATISTICS (Overall Store):
- Total Active Listings: ${evData.length}
- Price Range: LKR ${Math.min(...evData.map((e) => e.price)).toLocaleString()} - LKR ${Math.max(
      ...evData.map((e) => e.price)
    ).toLocaleString()}
- Average Price: LKR ${Math.round(
      evData.reduce((sum, e) => sum + e.price, 0) / evData.length
    ).toLocaleString()}
- Brands Available: ${Array.from(new Set(evData.map((e) => e.brand))).join(", ")}
- Categories: ${Array.from(new Set(evData.map((e) => e.category))).join(", ")}
- Colors Available: ${Array.from(new Set(evData.map((e) => e.color))).join(", ")}

INSTRUCTIONS:
- Provide a friendly, conversational response that's easy to read
- DO NOT use any markdown formatting: NO # headers, NO * asterisks, NO ** bold markers, NO markdown syntax
- Use plain text only with clear line breaks and spacing
- Format prices with commas for readability (e.g., LKR 18,500,000)
- Present information in a natural, flowing way
- When listing vehicles, format like this example:
  Tesla Model 3 (2024)
  Price: LKR 18,500,000
  Range: 420 km
  Battery Capacity: 80 kWh
  Color: Red
  Condition: New
- Use simple dashes (-) or numbers (1., 2., 3.) for lists, NOT asterisks
- For section titles, use plain text in ALL CAPS or just capitalize the first letter, followed by a line break
- Start with a brief greeting or acknowledgment
- Use double line breaks (\\n\\n) to separate major sections
- Use single line breaks for items within a section
- Format numbers with commas for better readability
- Keep paragraphs short and scannable
- If NO EVs match the specific criteria (empty list), suggest checking back later or viewing broadly available models from the statistics.
- Make the response feel like a helpful conversation, not a technical document
- Remember: Plain text only, no markdown symbols whatsoever`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    // Clean up any markdown that might have slipped through
    text = cleanMarkdown(text);

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

function cleanMarkdown(text: string): string {
  // Remove markdown headers (###, ##, #)
  text = text.replace(/^#{1,6}\s+/gm, '');
  
  // Remove bold markers (**text** or __text__)
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  
  // Remove italic markers (*text* or _text_)
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  
  // Remove bullet point asterisks at start of lines, replace with dashes
  text = text.replace(/^\s*\*\s+/gm, '- ');
  
  // Remove any remaining markdown link syntax [text](url)
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Clean up multiple spaces
  text = text.replace(/  +/g, ' ');
  
  // Clean up extra line breaks (more than 2 consecutive)
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
}

async function handleTestDriveSlotQuestion(
  userQuestion: string,
  testDriveRepo: ITestDriveRepository,
  evRepo?: IEvRepository
): Promise<string> {
  try {
    const question = userQuestion.toLowerCase();
    
    // Check if user is asking how to create/add a test drive slot
    if (
      question.includes("how") &&
      (question.includes("add") || question.includes("create"))
    ) {
      return `To add a test drive slot, you need to provide the following information:

1. Seller ID - Your seller account ID
2. Model ID - The EV model ID for the test drive
3. Location - The physical address where the test drive will take place
4. Available Date - The date when the slot is available (format: YYYY-MM-DD)
5. Max Bookings - Maximum number of bookings allowed for this slot

You can create a test drive slot through the seller dashboard or by using the API endpoint: POST /test-drive/slots

Required fields:
- seller_id: Your seller ID
- model_id: The EV model ID
- location: Address string
- available_date: Date in ISO format
- max_bookings: Number (e.g., 5)

Example:
{
  "seller_id": "your-seller-id",
  "model_id": "ev-model-id",
  "location": "123 Main Street, Colombo",
  "available_date": "2024-12-25T00:00:00.000Z",
  "max_bookings": 5
}`;
    }

    // If asking about available slots
    if (question.includes("available") || question.includes("list")) {
      const slots = await testDriveRepo.findActiveSlots();
      if (!slots || slots.length === 0) {
        return "There are currently no active test drive slots available.";
      }

      // Get today's date at midnight for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter out past dates - only show today and future slots
      const futureSlots = slots.filter((slot: any) => {
        const slotDate = new Date(slot.available_date);
        slotDate.setHours(0, 0, 0, 0);
        return slotDate >= today;
      });

      if (futureSlots.length === 0) {
        return "There are currently no upcoming test drive slots available. Please check back later for new slots.";
      }

      let response = `Here are the available test drive slots:\n\n`;
      
      futureSlots.slice(0, 10).forEach((slot: any, index: number) => {
        const slotDate = new Date(slot.available_date).toLocaleDateString();
        response += `${index + 1}. ${slot.model_id?.model_name || "EV Model"}\n`;
        response += `   Date: ${slotDate}\n`;
        response += `   Location: ${slot.location}\n`;
        response += `   Available Bookings: ${slot.max_bookings}\n`;
        response += `   Seller: ${slot.seller_id?.business_name || "N/A"}\n\n`;
      });

      if (futureSlots.length > 10) {
        response += `... and ${futureSlots.length - 10} more slot(s)`;
      }

      return cleanMarkdown(response);
    }

    return "I can help you with test drive slots. You can ask me:\n- How to add/create a test drive slot\n- List available test drive slots\n- Information about test drive bookings";
  } catch (error) {
    console.error("Test Drive Slot Question Error:", error);
    return "I encountered an error while fetching test drive slot information. Please try again later!";
  }
}

async function handleServiceLocationQuestion(
  userQuestion: string,
  repairLocationRepo: IRepairLocationRepository
): Promise<string> {
  try {
    const question = userQuestion.toLowerCase();
    
    // Get all active repair locations
    const locations = await repairLocationRepo.findActiveLocations();
    
    if (!locations || locations.length === 0) {
      return "There are currently no active service/repair locations available.";
    }

    let response = `Here are the available service and repair locations:\n\n`;
    
    locations.slice(0, 15).forEach((location: any, index: number) => {
      response += `${index + 1}. ${location.name || "Service Center"}\n`;
      response += `   Address: ${location.address}\n`;
      if (location.phone) {
        response += `   Phone: ${location.phone}\n`;
      }
      if (location.email) {
        response += `   Email: ${location.email}\n`;
      }
      response += `   Seller: ${location.seller_id?.business_name || "N/A"}\n`;
      if (location.latitude && location.longitude) {
        response += `   Coordinates: ${location.latitude}, ${location.longitude}\n`;
      }
      response += `   Status: ${location.is_active ? "Active" : "Inactive"}\n\n`;
    });

    if (locations.length > 15) {
      response += `... and ${locations.length - 15} more location(s)`;
    }

    response += `\n\nTotal Active Locations: ${locations.length}`;

    return cleanMarkdown(response);
  } catch (error) {
    console.error("Service Location Question Error:", error);
    return "I encountered an error while fetching service location information. Please try again later!";
  }
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