# Comprehensive Frontend Test Cases

> **Note**: For "Screenshot Required", capture the visible area showing the result/error.

## 1. Public & Authentication

| ID | Test Case Name | Prerequisite | Test Step | Input Data | Expected Result | Screenshot Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PUB_001** | Landing Page Load | None | Navigate to `/` | None | Header, Banner, Featured Models load. | **Yes** (Home Page) |
| **PUB_002** | Models Page Listing | None | Navigate to `/models` | None | Grid of cars displayed. | **Yes** (Models List) |
| **AUTH_001** | Register - Success | None | `/auth/register` -> Enter valid data | Valid Email, Pass > 6 chars | Account created. | **Yes** (Success Toast) |
| **AUTH_002** | **VAL - Register Empty** | None | `/auth/register` -> Click Register without data | Empty Fields | Errors: "Email is required", "Password is required". | **Yes** (Form Errors) |
| **AUTH_003** | **VAL - Invalid Email** | None | `/auth/register` -> Enter invalid email | Email: `user@.com` | Error: "Invalid email format". | **Yes** (Email Error) |
| **AUTH_004** | **VAL - Password Mismatch** | None | `/auth/register` -> Diff passwords | Pass: `123123`, Confirm: `123456` | Error: "Passwords must match". | **Yes** (Mismatch Error) |
| **AUTH_005** | **VAL - Password Length** | None | `/auth/register` -> Short password | Pass: `12345` | Error: "Password must be at least 6 characters". | **Yes** (Length Error) |
| **AUTH_006** | Login - Success | Registered | `/auth/login` -> Valid Creds | Valid Email/Pass | Redirect to Dashboard. | **Yes** (Dashboard) |
| **AUTH_007** | **VAL - Login Invalid** | None | `/auth/login` -> Invalid Creds | Wrong Pass | Error Toast: "Invalid credentials". | **Yes** (Login Error) |

## 2. Buyer Module

| ID | Test Case Name | Prerequisite | Test Step | Input Data | Expected Result | Screenshot Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BUY_001** | Dashboard View | Buyer Logged In | Go to `/user/dashboard` | None | Widgets: Orders, Wishlist visible. | **Yes** (Buyer Dash) |
| **BUY_002** | Vehicle Search | Models Page | Type in search bar | Term: "Tesla" | Filtered list showing only matches. | **Yes** (Search Result) |
| **BUY_003** | Add to Cart | Vehicle Detail | Click "Add to Cart" | Qty: 1 | Cart badge count increases. | **Yes** (Cart Badge) |
| **BUY_004** | Checkout Form Load | Items in Cart | Go to `/user/checkout` | None | Address form and Order Summary visible. | **Yes** (Checkout Page) |
| **BUY_005** | **VAL - Checkout Empty** | Checkout Page | Click "Pay" without address | Empty Address | Error: "Address is required". | **Yes** (Address Error) |
| **BUY_006** | Payment - Card | Checkout Filled | Enter Card Details -> Pay | Valid Card (Test) | Success Page `/user/payment/return`. | **Yes** (Success Page) |
| **BUY_007** | **VAL - Pay Invalid Card**| Checkout Filled | Enter Invalid Card -> Pay | Invalid Card | Error Page `/payment/failed`. | **Yes** (Failure Page) |
| **BUY_008** | Order History | Paid Order | Go to `/user/orders` | None | New order listed as "Pending". | **Yes** (Order List) |
| **BUY_009** | Test Drive Booking | Vehicle Page | "Book Test Drive" -> Select Date | Future Date | Booking Success Modal. | **Yes** (Booking Modal) |
| **BUY_010** | **VAL - Past Date Drive**| Vehicle Page | "Book Test Drive" -> Past Date | Yesterday's date | Error: "Date must be in future" (or disabled). | **Yes** (Date Error) |
| **BUY_011** | Financing App | Buyer Dash | `/user/financing` -> Apply | Income Docs | Application Submitted message. | **Yes** (App Success) |
| **BUY_012** | **VAL - Fin Empty Docs**| Financing Page | Submit without files | No Files | Error: "Documents required". | **Yes** (Upload Error) |

## 3. Seller Module

| ID | Test Case Name | Prerequisite | Test Step | Input Data | Expected Result | Screenshot Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEL_001** | Seller Dash Load | Seller Logged In | `/seller/dashboard` | None | Stats: Sales, Inventory, Revenue. | **Yes** (Seller Dash) |
| **SEL_002** | Add Vehicle - Step 1 | Seller Dash | "Add Vehicle" -> Step 1 | Brand, Category | Step 1 valid, moves to Step 2. | **Yes** (Step 1) |
| **SEL_003** | **VAL - Step 1 Empty** | Add Vehicle | Click Next without selection | Empty Fields | Errors: "Brand required", "Category required". | **Yes** (Step 1 Errors) |
| **SEL_004** | Add Vehicle - Step 2 | Step 1 Done | Fill Specs -> Next | Model: "Model X" | Step 2 valid, moves to Step 3. | **Yes** (Step 2) |
| **SEL_005** | **VAL - Step 2 Missing**| Step 1 Done | Leave Model Empty -> Next | Empty Model | Error: "Model name is required". | **Yes** (Step 2 Errors) |
| **SEL_006** | Add Vehicle - Step 3 | Step 2 Done | Fill Price/Cond -> Next | Price: 50000 | Step 3 valid, moves to Step 4. | **Yes** (Step 3) |
| **SEL_007** | **VAL - Negative Price**| Step 2 Done | Enter neg price -> Next | Price: -100 | Error: "Price must be positive". | **Yes** (Price Error) |
| **SEL_008** | **VAL - Reg Year < Year**| Step 2 Done | Reg Year < Model Year | Reg: 2020, Year: 2021 | Error: "Registration must be >= Year". | **Yes** (Year Error) |
| **SEL_009** | Add Vehicle - Images | Step 3 Done | Upload 1 Image -> Submit | 1 Valid Img | Success: "Vehicle Listed". | **Yes** (Success Msg) |
| **SEL_010** | **VAL - No Images** | Step 3 Done | Submit without image | No Images | Error: "At least one image is required". | **Yes** (Image Error) |
| **SEL_011** | **VAL - Max Images** | Step 3 Done | Upload 6 Images | 6 Images | Error: "Max 5 images allowed". | **Yes** (Max Img Error) |
| **SEL_012** | Manage Orders | Pending Order | `/seller/orders` -> Mark Shipped | Status: Shipped | Status updates in Real-time. | **Yes** (Order Status) |
| **SEL_013** | Repair Location | Seller Dash | Add Location | Address/Coords | Location appears on Map/List. | **Yes** (Map Pin) |

## 4. Financial & Admin Modules

| ID | Test Case Name | Prerequisite | Test Step | Input Data | Expected Result | Screenshot Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FIN_001** | View Loan Apps | Finance Logged In | `/financial/applications` | None | List of buyer applications. | **Yes** (App List) |
| **FIN_002** | Approve Loan | Pending App | Click Approve | None | Status -> Approved. Buyer Notified. | **Yes** (Approved State) |
| **ADM_001** | User List | Admin Logged In | `/admin/users` | None | Table of all users. | **Yes** (User Table) |
| **ADM_002** | Ban User | User List | Click Ban on User | User ID | Status -> Banned. | **Yes** (Ban Status) |
| **ADM_003** | ML Pipeline | Admin Dash | Trigger Retraining | None | "Training Started" toast. | **Yes** (Training Toast) |
| **ADM_004** | Resolve Complaint | Complaint List | Click Resolve | Comment: "Done" | Complaint moved to Resolved tab. | **Yes** (Resolved List) |

## 5. Security & Edge Cases

| ID | Test Case Name | Prerequisite | Test Step | Input Data | Expected Result | Screenshot Required |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC_001** | Bypassing Auth | None | Direct URL: `/user/dashboard`| None | Redirect to Login. | **Yes** (Login Redir) |
| **SEC_002** | Role Guard (Buy->Sel)| Buyer Logged | Direct URL: `/seller/dashboard`| None | "Unauthorized" Page. | **Yes** (401 Page) |
| **SEC_003** | 404 Page | None | `/random-garbage-url` | None | Custom 404 Page. | **Yes** (404 Page) |
