
# **Fiducia API Documentation**

**Base URL**: `/api`

This document outlines the API endpoints for the Fiducia web app, covering authentication, customer actions, and merchant tasks.

## **Authentication**

Authentication is required for most endpoints and is handled by signing a message with a crypto wallet (Sign-In with Ethereum). The process provides a JWT token for session management.

### 1. Get Challenge Message

Requests a unique message that the user needs to sign with their wallet to prove ownership.

- **Endpoint**: `GET /auth/challenge`
- **Query Parameter**: `address` (The user's wallet address)
- **Example URL**: `/api/auth/challenge?address=0x11111...`
- **Success Response**:
  ```json
  {
    "message": "Sign this message to log in to Fiducia. Domain:***.com Nonce: 12345xyz"
  }
  ```

### 2. Log In with Signature

Submits the signed message to the server to get a session token (JWT).

- **Endpoint**: `POST /auth/login`
- **Request Body**:
  ```json
  {
    "address": "0x11111...",
    "signature": "0x..."
  }
  ```
- **Success Response**:
  ```json
  {
    "token": "...",
    "user": {
      "address": "0x11111...",
      "role": "customer"
    }
  }
  ```
  
> **Note**: For all subsequent authenticated requests, include the token in the header: `Authorization: Bearer <your_jwt_token>`.

### 3. Set Role

Set the role if the user is a first time user with no role assigned.

- **Endpoint**: `POST /user/role`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "role": "consumer"
  }
  ```
- **Success Response**:
  ```json
  {
    "token": "...",
    "user": {
      "address": "0x11111...",
      "role": "customer"
    }
  }
  ```

-----

## **Customer Flow API**

Endpoints used by the customer-facing application.

### 1. Send Chat Message

Sends a user's text to the chatbot. The response can be a simple text reply or a request for payment to create an order. The backend chatbot should keep interacting with user to clarify all requirements. Once everything is defined, call structured output and response with a payment request.

- **Endpoint**: `POST /chat/messages`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "text": "I want to order a large pepperoni pizza."
  }
  ```

- **Example Success Response (Payment Request)**:
  ```json
  {
    "type": "payment",
    "orderId": "order-abc-123",
    "payload": {
      "message": "Order created! Total is 25 USDC. Please confirm payment.",
      "transaction": {
        "to": "0xContractAddress...", // Smart contract address
        "value": "25000000", // Amount in a certain unit
        "data": "0x..." // Transaction data
      }
    }
  }
  ```

- **Example Success Response (Simple Text Reply)**:
  ```json
    {
      "type": "text",
      "payload": {
        "message": "Of course. Do you have any preference for the restaurants?"
      }
    }
    ```

### 2. Confirm Payment

Notifies the backend that the user has submitted the payment transaction on the blockchain. The dashboard will refresh if payment successfully submitted.

- **Endpoint**: `POST /orders/{orderId}/confirm-payment`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "txHash": "0xTransactionHash..."
  }
  ```
- **Success Response**:
  ```json
  {
    "status": "PENDING_CONFIRMATION",
    "message": "Payment submitted, awaiting blockchain confirmation."
  }
  ```

### 3. Get My Orders

Fetches a list of all orders for the customer's dashboard.

- **Endpoint**: `GET /orders`
- **Authentication**: Required
- **Success Response**:
  ```json
  [
    {
      "orderId": "order-abc-123",
      "description": "Large pepperoni pizza",
      "status": "AWAITING_FULFILLMENT",
      "amount": "25 USDC"
    }
  ]
  ```

### 4. Customer Feedback

#### 1. Received

The customer needs to confirm that they have received the product/service after the merchant claims the order is complete, which triggers the smart contract to release funds to the merchant.

- **Endpoint**: `POST /orders/{orderId}/confirm-finish`
- **Authentication**: Required
- **Success Response**:
  ```json
  {
    "orderId": "order-abc-123",
    "status": "COMPLETED",
    "message": "Order completed and funds released."
  }
  ```

#### 2. Raise a Dispute

The customer reports a problem with the order. This freezes the funds in the smart contract and may lead to refund.

- **Endpoint**: `POST /orders/{orderId}/dispute`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "reason": "The pizza delivered was incorrect."
  }
  ```
- **Success Response**:
  ```json
  {
    "orderId": "order-abc-123",
    "status": "DISPUTED",
    "message": "Dispute has been raised. The funds will be frozen temporarily. Please wait for third-party to determine."
  }
  ```

-----

## **Merchant Flow API**

Endpoints used by the business/merchant dashboard.

### 1. Get Assigned Tasks

Fetches a list of all active orders assigned to the merchant.

- **Endpoint**: `GET /tasks`
- **Authentication**: Required (role="business")
- **Success Response**:
  ```json
  [
    {
      "orderId": "order-abc-123",
      "description": "Large pepperoni pizza",
      "status": "AWAITING_FULFILLMENT",
      "payout": "25 USDC"
    }
  ]
  ```

### 2. Update Task Status

Updates the status of an order (e.g., from "in progress" to "out for delivery"). We may integrate oracles for delivery status later.

- **Endpoint**: `POST /tasks/{orderId}/status`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "status": "OUT_FOR_DELIVERY"
  }
  ```
- **Success Response**:
  ```json
  {
    "orderId": "order-abc-123",
    "status": "OUT_FOR_DELIVERY",
    "message": "Status updated successfully."
  }
  ```