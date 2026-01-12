export interface Application {
    _id: string;
    user_id: string;
    order_id: string;
    list_id: string;
  
    message_text: string;
  
    application_data: {
      full_name: string;
      age: number;
      employment_status: string;
      monthly_income: number;
      requested_amount: number;
      repayment_period_months: number;
    };
  
    additional_documents: string[];
  
    status: string;
  
    createdAt: string;
    updatedAt: string;
    processed_at?: string;
  
    __v: number;
  }
  