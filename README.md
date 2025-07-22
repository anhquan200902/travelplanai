# ItinerAIry

ItinerAIry is a comprehensive AI-powered trip planning application that helps you create detailed, personalized travel itineraries with smart budget management and professional documentation.

## Features

### Core Planning Features
- **AI-powered trip planning** using Groq's Llama3-70B model for intelligent itinerary generation
- **Smart itinerary generation** with detailed day-by-day planning and activity recommendations
- **Multi-currency budget support** with 160+ currencies for global travel planning
- **Real-time cost estimation** with regional pricing data and accurate budget projections
- **Advanced date management** with flexible input options and intelligent date parsing
- **Interest-based personalization** including food, culture, beach, hiking, nightlife, and more
- **Group size configuration** supporting 1-20 people with adjusted recommendations
- **Custom requirements and special requests** for personalized travel experiences

### Budget & Cost Management
- **Comprehensive cost breakdown** by category (accommodation, food, activities, transportation)
- **Budget vs. actual analysis** with intelligent alerts and recommendations
- **Regional pricing intelligence** for accurate cost estimates worldwide
- **Multi-currency support** with real-time conversion and local pricing

### Export & Documentation
- **Professional PDF export** with comprehensive travel documents
- **Detailed itineraries** including schedules, locations, and cost breakdowns
- **Travel-ready documentation** with all essential trip information

### User Experience
- **Form validation** with real-time completeness tracking and helpful feedback
- **Responsive design** with mobile-friendly interface for planning on-the-go
- **Intuitive interface** designed for seamless trip planning experience

### Technical Features
- **Modern tech stack** built with Next.js 15.4.2, React 19.1.0, and TypeScript 5
- **Comprehensive validation system** ensuring data integrity and user input accuracy
- **Performance monitoring** with Vercel Speed Insights for optimal user experience
- **Secure API endpoints** with robust error handling and data protection

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- npm

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/anhquan200989/itinerairy.git
    cd itinerairy
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

### Planning Your Trip

1.  **Enter destination and dates:** Specify your travel destination and flexible date options using our intelligent date input system
2.  **Configure group details:** Set your group size (1-20 people) and travel preferences
3.  **Set budget and currency:** Choose from 160+ supported currencies and set your budget range
4.  **Select interests:** Pick from various categories like food, culture, beach activities, hiking, nightlife, and more
5.  **Add custom requirements:** Include any special requests or specific needs for your trip

### Generating Your Itinerary

6.  **Generate AI-powered itinerary:** Click the "Generate" button to create your personalized travel plan
7.  **Review detailed planning:** Examine your day-by-day itinerary with activity recommendations and scheduling
8.  **Analyze cost estimates:** Review comprehensive cost breakdowns by category with regional pricing
9.  **Budget analysis:** Compare estimated costs against your budget with intelligent alerts and suggestions

### Exporting and Documentation

10. **Export professional PDF:** Generate comprehensive travel documents including itineraries, cost breakdowns, and essential trip information
11. **Save and share:** Download your complete travel plan for offline access and easy sharing

The application provides real-time validation and feedback throughout the planning process, ensuring all required information is complete before generating your personalized itinerary.

## Deployment

The easiest way to deploy your ItinerAIry app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.