# RoamRoutes Travel App

## Overview

RoamRoutes is a social travel planning application that helps adventurous travellers connect with like-minded individuals and plan trips together. The app features:

- **Profile-based matching**: Connect with travellers who share your interests and travel style
- **Itinerary creation**: Generate and customize travel itineraries for any destination
- **Activity planning**: Browse and save activities to create the perfect trip
- **Real-time chat**: Communicate with your matches and share travel ideas
- **Itinerary sharing**: Collaborate on travel plans by sharing and saving itineraries

Built with React Native and Expo, RoamRoutes provides a seamless mobile experience for travellers looking to find companions and create memorable journeys together.

## Installation and Setup

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- Firebase account (for backend services)

### Getting Started

1. Clone the repository:

```bash
git clone https://github.com/ConorRoberts1/RoamRoutesProject.git
cd RoamRoutesProject/frontend
```

2. Install dependencies:

```bash
npm install
```

3. Configure Firebase:

- Add your Firebase configuration into the `/config` directory.
- Make sure to add your Firebase config file to `.gitignore`.

4. Start the development server:

```bash
npx expo start
```

5. Run the app:

- Use an iOS simulator
- Use an Android emulator
- Or scan the QR code with the Expo Go app on your physical device

### Project Structure

```
frontend/
├── app/                    # Main application code (file-based routing)
│   ├── (tabs)/             # Tab-based navigation screens
│   ├── auth/               # Authentication screens
│   ├── chat/               # Chat functionality
│   ├── connections/        # User connections and matching
│   ├── profile/            # User profile screens
│   └── tripCreation/       # Trip planning screens
├── assets/                 # Static assets (images, fonts)
├── components/             # Reusable React components
├── config/                 # Configuration files
├── constants/              # App constants and theme
├── utils/                  # Utility functions
```

## Key Features

- **User Authentication**: Email-based signup and login
- **Profile Creation**: Create detailed travel profiles with preferences
- **Matchmaking**: Find compatible travel companions
- **Itinerary Generation**: AI-assisted trip planning
- **In-app Messaging**: Chat with matches
- **Itinerary Sharing**: Collaborate on travel plans
