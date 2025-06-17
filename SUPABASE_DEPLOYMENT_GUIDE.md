# 🚀 MetroSocial Supabase Deployment Guide

## Overview
This guide will help you migrate MetroSocial from in-memory storage to a production-ready Supabase backend with PostgreSQL database, real-time features, and PostGIS location services.

## ✅ Prerequisites
- Node.js 14+ installed
- Git installed
- A Supabase account (free tier available)

## 🎯 Step 1: Create Supabase Project

### 1.1 Set up Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login with GitHub (recommended)
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: `metrosocial`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier (perfect for testing)

### 1.2 Wait for Setup
- Project creation takes 2-3 minutes
- You'll get a project dashboard when ready

## 🗄️ Step 2: Set up Database Schema

### 2.1 Access SQL Editor
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**

### 2.2 Execute Schema
Copy and paste the entire content from `supabase-schema.sql` into the SQL editor and click **Run**.

This will create:
- ✅ Users table with auth integration
- ✅ Posts table with content support
- ✅ Comments table with threading
- ✅ User locations with PostGIS support
- ✅ Nearby users function using geospatial queries
- ✅ Real-time triggers and RLS policies

### 2.3 Enable Extensions
The schema automatically enables:
- `uuid-ossp` for UUID generation
- `postgis` for location features

## 🔧 Step 3: Configure Environment Variables

### 3.1 Get Supabase Credentials
In your Supabase dashboard:
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**
   - **Project API Keys** → **anon public**

### 3.2 Create Environment File
Create `.env.local` in your project root:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_SOCKET_SERVER_URL=http://localhost:5000
```

**⚠️ Important**: Replace with your actual Supabase URL and key!

## 🔄 Step 4: Migrate Contexts to Supabase

### 4.1 Update AuthContext
The migration includes a new Supabase-powered auth system:
- Built-in email/password authentication
- Automatic user profile creation
- Secure session management
- Real-time profile updates

### 4.2 Update PostContext
Enhanced with Supabase features:
- PostgreSQL data persistence
- Real-time post updates
- Advanced querying capabilities
- Automatic user data joins

### 4.3 Update LocationContext
Powered by PostGIS:
- Efficient geospatial queries
- Real-time location tracking
- Distance calculations
- Online status management

## 🧪 Step 5: Test the Migration

### 5.1 Start the Application
```bash
npm start
```

### 5.2 Test Core Features
1. **Registration**: Create a new account
2. **Login**: Sign in with credentials
3. **Profile**: Update profile with avatar
4. **Posts**: Create posts with text/images
5. **Location**: Enable location services
6. **Proximity**: Test nearby user detection

### 5.3 Verify Database
In Supabase dashboard:
1. Go to **Table Editor**
2. Check that data appears in:
   - `users` table
   - `posts` table
   - `user_locations` table

## 🌐 Step 6: Deploy to Production

### 6.1 Build for Production
```bash
npm run build
```

### 6.2 Deploy Frontend Options

#### Option A: Netlify (Recommended)
1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repo
3. Deploy settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
4. Add environment variables in Netlify:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`

#### Option B: Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub project
3. Add environment variables
4. Deploy automatically

#### Option C: Supabase Hosting (Soon)
Supabase is launching static site hosting - perfect for React apps!

### 6.3 Update CORS Settings
In Supabase dashboard:
1. Go to **Authentication** → **Settings**
2. Add your production URL to **Site URL**
3. Add production domain to **Additional Redirect URLs**

## 🔒 Step 7: Production Security

### 7.1 Row Level Security (RLS)
Already configured in the schema:
- Users can only update their own profiles
- Posts/comments are viewable by everyone
- Users can only modify their own content

### 7.2 API Rate Limiting
Supabase includes built-in rate limiting on the free tier.

### 7.3 Environment Security
- Never commit `.env.local` to git
- Use different Supabase projects for dev/prod
- Rotate API keys regularly

## 📊 Step 8: Real-time Features

### 8.1 Available Real-time Channels
- **Posts**: New posts appear instantly
- **Comments**: Live comment updates
- **Location**: Real-time user proximity
- **Online Status**: Live online/offline updates

### 8.2 Performance Optimization
- Automatic connection pooling
- Efficient PostgreSQL queries
- PostGIS spatial indexing
- Built-in caching

## 🚀 Step 9: Scaling Considerations

### 9.1 Free Tier Limits
- 50,000 monthly active users
- 500MB database
- 1GB file storage
- Unlimited API requests

### 9.2 Upgrade Path
When you need more:
- **Pro**: $25/month (100,000 MAU)
- **Team**: $599/month (unlimited)
- Custom enterprise pricing

## 🔧 Step 10: Monitoring & Analytics

### 10.1 Built-in Monitoring
Supabase dashboard provides:
- Real-time usage metrics
- API request analytics
- Database performance stats
- Error logging

### 10.2 Optional Integrations
- Google Analytics for user behavior
- Sentry for error tracking
- PostHog for product analytics

## 🆘 Troubleshooting

### Common Issues

#### Authentication Errors
```
Error: Invalid login credentials
```
**Solution**: Check email/password, verify user exists in auth.users table

#### Database Connection
```
Error: relation "public.users" does not exist
```
**Solution**: Re-run the schema SQL, check table creation

#### Real-time Not Working
```
No real-time updates
```
**Solution**: Check network, verify RLS policies, confirm channel subscriptions

#### Location Services
```
PostGIS function not found
```
**Solution**: Ensure PostGIS extension is enabled in SQL editor

### Getting Help
1. Check Supabase documentation
2. MetroSocial GitHub issues
3. Supabase Discord community
4. Stack Overflow with supabase tag

## 🎉 Success Checklist

- [ ] Supabase project created
- [ ] Database schema executed
- [ ] Environment variables configured
- [ ] Authentication working
- [ ] Posts and comments working
- [ ] Location services working
- [ ] Real-time updates working
- [ ] Frontend deployed
- [ ] Production testing complete

## 🚀 Next Steps

After successful deployment:

1. **Add More Features**:
   - Push notifications
   - Image/file uploads with Supabase Storage
   - Advanced user search
   - Chat/messaging system

2. **Optimize Performance**:
   - Add database indexes
   - Implement caching strategies
   - Optimize real-time subscriptions

3. **Scale the App**:
   - Add CDN for static assets
   - Implement edge functions
   - Add advanced analytics

4. **Community Building**:
   - User feedback system
   - Moderation tools
   - Community guidelines

---

## 📞 Support

Need help with the migration? 

- **Documentation**: Check the detailed code comments
- **GitHub Issues**: Report bugs or request features
- **Community**: Join discussions about proximity-based social apps

Happy deploying! 🎯 