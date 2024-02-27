Sure, here's a basic README guide to install a Next.js project locally using environment variables:

---

## Installation Guide for Next.js with .env Configuration

This guide will walk you through setting up a Next.js project locally while utilizing environment variables for configuration.

### Prerequisites

- Node.js installed on your machine

### Installation Steps

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/Dzyfhuba/knn-water-fertility.git
   cd knn-water-fertility
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Environment Variable Setup:**

   Create a `.env` file in the root directory of your project and add the following variables:

   ```plaintext
   APP_NAME=
   APP_DESCRIPTION=
   
   APP_ENV=
   NEXT_PUBLIC_APP_ENV=
   
   NEXT_PUBLIC_APP_NAME=
   NEXT_PUBLIC_APP_DESCRIPTION=
   
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

   Make sure to replace the values with your desired configurations.

4. **Start the Development Server:**

   ```bash
   npm run dev
   ```

   This command will start the Next.js development server. You can access your application at `http://localhost:3000`.

### Usage

- Access the application via the provided URL.
- Modify environment variables in the `.env` file as needed for different configurations or environments.

### Additional Notes

- Remember not to commit sensitive information such as API keys or secrets to version control systems.
- Always add `.env` to your `.gitignore` file to avoid accidental exposure of sensitive information.

---

This README provides a simple guide to set up a Next.js project locally using environment variables stored in a `.env` file. Adjust the instructions according to your project's specific requirements and additional setup steps if necessary.