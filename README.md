# Bookstore Frontend

This is the customer-facing Single Page Application (SPA) for the Bookstore platform, inspired by standard, modern e-commerce storefronts. It utilizes React.js through Vite for rapid development and is packaged with a multi-stage Docker build ready for production deployment.

## Tech Stack

- **Framework**: React.js 18
- **Build Tool**: Vite
- **Routing**: React Router DOM (v6)
- **Styling**: Vanilla CSS (Custom premium aesthetics without external UI frameworks)
- **Icons**: Lucide React
- **HTTP Client**: Axios (Ready for backend integration)

## Architecture & Directory Structure

```text
frontend/
├── Dockerfile          # Multi-stage build process (Node to Nginx)
├── nginx.conf          # Nginx configurations for React Router Fallback
├── index.html          # Application entry point
├── package.json        # Dependencies & scripts
└── src/
    ├── main.jsx        # Root React initialization
    ├── App.jsx         # Application Router setup
    ├── index.css       # Global styles, variables, and design tokens
    ├── layouts/
    │   ├── UserLayout.jsx    # Primary structural layout (Navbar, Footer)
    │   └── UserLayout.css    # Layout-specific styling
    └── pages/
        └── user/
            ├── HomePage.jsx  # Landing page featuring Hero Banner & Product Grid
            └── HomePage.css  # Component-specific styles
```

## Features

- **Responsive Navigation**: Includes search bar and real-time fast-actions (Cart & User Profile).
- **Premium User Interface**: Implemented smooth hover mechanics, shadows, and interactive components.
- **Dedicated Layouts**: `UserLayout` creates consistent global framing.
- **Separation of Concerns**: Each major component or page utilizes isolated local CSS files along with global design tokens inherited from `index.css`.

## Development

### Prerequisites
- Node.js (v18+)

### Running Locally
To run the server in development mode:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```

### Building for Production
To optimize and compile the application for production environments:
```bash
npm run build
```
This command bundles React into static assets ready to be served by any static file server or CDN natively, which will be output into the `dist/` directory.

## Docker Deployment (Production-Ready)

The frontend is containerized using a high-performance multi-stage Docker setup. It first builds the application using Node, and then hosts the static compiled `dist` files via an Nginx alpine image.

### Building the Image
```bash
docker build -t bookstore-frontend .
```

### Running the Container
```bash
docker run -p 80:80 bookstore-frontend
```

*(Note: In a wider microservices ecosystem, this will be handled automatically via a `docker-compose.yml` file mapping port `80` to the host or API Gateway).*
