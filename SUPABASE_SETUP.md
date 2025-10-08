# 🚀 Supabase Setup Guide for V-Sign Photo Editor

This guide will walk you through setting up Supabase for your V-Sign Photo Editor application.

## 📋 Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js and npm/pnpm installed
- Basic understanding of SQL

## 🎯 Step 1: Create a Supabase Project

1. **Go to Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign in to your account

2. **Create New Project**
   - Click "New Project"
   - Choose your organization
   - Enter project details:
     - **Name**: `vsign-photo-editor`
     - **Database Password**: Create a strong password (save this!)
     - **Region**: Choose the region closest to your users
   - Click "Create new project"

3. **Wait for Setup**
   - Project creation takes 1-2 minutes
   - You'll see a progress indicator

## 🔑 Step 2: Get Your API Keys

Once your project is ready:

1. **Navigate to Settings**
   - Go to Settings → API in the left sidebar

2. **Copy the Required Values**
   - **Project URL**: Copy the URL (starts with `https://`)
   - **Anon Key**: Copy the `anon` key (starts with `eyJ`)
   - **Service Role Key**: Copy the `service_role` key (starts with `eyJ`)

   ⚠️ **Important**: Keep the service role key secret! Never expose it in client-side code.

## 🗄️ Step 3: Set Up Database Schema

1. **Open SQL Editor**
   - Go to SQL Editor in the Supabase dashboard
   - Click "New query"

2. **Run the Migration**
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the migration

3. **Verify Tables Created**
   - Go to Table Editor
   - You should see the following tables:
     - `users`
     - `projects`
     - `images`
     - `processing_jobs`
     - `user_sessions`

## 🔐 Step 4: Configure Authentication

1. **Enable Email Authentication**
   - Go to Authentication → Settings
   - Under "Auth Providers", ensure Email is enabled

2. **Configure Email Templates (Optional)**
   - Go to Authentication → Email Templates
   - Customize the confirmation and reset password emails

3. **Set Site URL**
   - In Authentication → Settings
   - Set Site URL to: `http://localhost:5173` (for development)
   - For production, use your actual domain

## 🌍 Step 5: Configure Environment Variables

1. **Copy Environment Template**
   ```bash
   cp .env.example .env
   ```

2. **Update .env File**
   Open `.env` and replace the placeholder values:
   ```env
   # Google Gemini API Configuration
   GOOGLE_API_KEY=your_actual_google_gemini_api_key

   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Frontend Configuration
   VITE_API_URL=http://localhost:3001
   ```

## 🧪 Step 6: Test the Connection

1. **Start the Development Server**
   ```bash
   npm run dev
   ```

2. **Test Database Connection**
   - The application should start without errors
   - Try registering a new user
   - Check the Supabase dashboard to see if the user appears in the Authentication section

## 🔒 Step 7: Set Up Row Level Security (RLS)

The migration script automatically sets up RLS policies, but here's what they do:

- **Users**: Can only view and update their own profile
- **Projects**: Users can manage their own projects, view public projects
- **Images**: Users can manage their own images, view images in public projects
- **Processing Jobs**: Users can only access their own processing jobs

## 📊 Step 8: Optional - Set Up Realtime (Advanced)

If you want real-time updates for processing status:

1. **Enable Realtime**
   - Go to Database → Replication
   - Enable realtime for the `processing_jobs` table

2. **Update Frontend Code**
   - The application can subscribe to changes in processing job status

## 🚨 Troubleshooting

### Common Issues:

1. **"Invalid API key" Error**
   - Double-check your API keys in `.env`
   - Ensure no extra spaces or characters

2. **"relation does not exist" Error**
   - Make sure you ran the migration script
   - Check that all tables were created in the Table Editor

3. **Authentication Issues**
   - Verify the Site URL is set correctly
   - Check that email authentication is enabled

4. **RLS Policy Errors**
   - Ensure you're using the correct user context
   - Check that RLS policies are properly set up

### Getting Help:

- Check the [Supabase Documentation](https://supabase.com/docs)
- Visit the [Supabase Community](https://github.com/supabase/supabase/discussions)
- Review the application logs for specific error messages

## 🎉 Next Steps

Once Supabase is set up:

1. **Configure Google Gemini API** (for AI image processing)
2. **Test user registration and login**
3. **Upload and process your first image**
4. **Deploy to production** (remember to update environment variables)

## 📝 Production Deployment Notes

When deploying to production:

1. **Update Site URL** in Supabase Authentication settings
2. **Use production environment variables**
3. **Enable database backups** in Supabase dashboard
4. **Set up monitoring** for your database usage
5. **Review and adjust RLS policies** if needed

---

**🔐 Security Reminder**: Never commit your `.env` file to version control. The `.env` file is already in `.