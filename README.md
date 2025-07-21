# Trip AI

This is a Next.js application that helps you plan your trips using AI.

## Features

- Generate travel itineraries based on your interests.
- Export your itinerary to PDF.
- User-friendly interface.

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- npm

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/trip-ai.git
    cd trip-ai
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a file named `.env.local` in the root of the project and add the following:

    ```
    GROQ_API_KEY=your_groq_api_key
    ```

    You can get your Groq API key from [https://console.groq.com/keys](https://console.groq.com/keys).

### Running the Application

To start the development server, run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## How to Use

1.  Enter your travel destination, duration, and interests in the input fields.
2.  Click the "Generate" button.
3.  The AI will generate a travel itinerary for you.
4.  You can then export the itinerary as a PDF.

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.