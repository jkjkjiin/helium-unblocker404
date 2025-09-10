# Overview

This project is a reverse-engineered web proxy browser called "Helium Unblocker" that uses Ultraviolet proxy technology to bypass website restrictions. It features a multi-tab browser interface with customizable appearance, built-in apps/games section, and cloaking functionality to disguise the tab appearance. The application includes a landing page with time display, settings management, and integration with various web proxy services.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Multi-tab Browser Interface**: Custom browser implementation with tab management, navigation controls, and URL handling
- **Modular Page System**: Separate subpages for different functionality (apps, settings, landing, dev tools) loaded dynamically
- **Responsive Design**: Uses CSS Grid/Flexbox with Tailwind CSS for styling and Inter font for typography
- **Theme System**: CSS custom properties for dynamic theming with background and color customization

## Proxy Integration
- **Ultraviolet Proxy**: Core proxy functionality using UV service worker for URL encoding/decoding and request routing
- **Service Worker Registration**: Custom service worker (sw.js) handles fetch events and proxy routing through UV
- **BareMux Integration**: Additional proxy transport layer for enhanced compatibility
- **Epoxy Transport**: Alternative transport mechanism for proxy connections

## Tab Cloaking System
- **Dynamic Tab Cosmetics**: JavaScript-based system to change tab title and favicon to mimic legitimate educational sites
- **Preset Configurations**: Pre-built disguises for popular educational platforms (Schoology, Google Classroom, Canvas, etc.)
- **Keyboard Shortcuts**: Hidden activation using Shift + ` key combination to access unblocker interface

## Application Management
- **Apps Catalog**: JSON-based application registry with categorization and filtering
- **Dynamic Loading**: Apps loaded from external JSON configuration with image assets and URL routing
- **Category System**: Filterable app categories with "All", "Utility", and custom categories

## Settings & Configuration
- **Local Storage Persistence**: User preferences stored in browser localStorage
- **Multi-panel Interface**: Tabbed settings interface for different configuration categories
- **Setup Wizard**: Multi-step onboarding process for initial configuration

## Static File Serving
- **Express.js Server**: Simple Node.js server serving static files with fallback routing
- **Asset Management**: Organized directory structure for icons, stylesheets, and JavaScript bundles

# External Dependencies

## Core Technologies
- **Express.js**: Web server framework for static file serving
- **Ultraviolet**: Primary proxy service for web traffic routing and URL encoding
- **BareMux**: Secondary proxy transport layer
- **Epoxy**: Alternative transport mechanism for proxy connections

## Frontend Libraries
- **Tailwind CSS**: Utility-first CSS framework loaded via CDN
- **Google Fonts**: Inter font family for consistent typography
- **Lucide Icons**: Icon library for UI elements

## Proxy Services
- **@tomphttp/bare-server-node**: Bare server implementation for proxy functionality
- **WebSocket Support**: Real-time communication for proxy connections

## Third-party Integrations
- **IP Geolocation**: wtfismyip.com API for country-based access control
- **Analytics Tracking**: Google Analytics integration with custom tracking
- **External Script Loading**: Dynamic loading of tracking and analytics scripts

## Development Tools
- **Prettier**: Code formatting for consistent style
- **Vercel**: Deployment configuration for hosting
- **Node.js**: Runtime environment with ES modules support

## Browser APIs
- **Service Workers**: For request intercepting and proxy routing
- **Local Storage**: For persistent user preferences and settings
- **Fetch API**: For making proxy requests and external API calls