# MandarinMaster Deployment Guide

## Pre-Deployment Checklist ✅

### 1. Code Quality & Features Status
- ✅ **Database**: PostgreSQL configured and connected
- ✅ **Object Storage**: Set up with bucket ID `replit-objstore-034af1a5-fc4b-45f5-b69d-4b8311a590e4`
- ✅ **Authentication**: Session-based auth with PostgreSQL session store
- ✅ **UI Theme**: Complete green color scheme implemented
- ✅ **Core Features**:
  - ✅ Progressive Practice System with hearts and XP
  - ✅ AI Conversation (OpenAI GPT-4o)
  - ✅ Voice Translator with speech recognition
  - ✅ Text Generator with topics and difficulty levels
  - ✅ Media Reader (PDF, images, video, audio)
  - ✅ Vocabulary Management with spaced repetition
  - ✅ Assessment System with level placement
  - ✅ Flashcards for reviewing mistakes
  - ✅ Progress tracking and persistence

### 2. Environment Variables Required
```env
DATABASE_URL=<your_postgres_url>
OPENAI_API_KEY=<your_openai_api_key>
PGDATABASE=<database_name>
PGHOST=<database_host>
PGPASSWORD=<database_password>
PGPORT=<database_port>
PGUSER=<database_user>
PUBLIC_OBJECT_SEARCH_PATHS=/replit-objstore-034af1a5-fc4b-45f5-b69d-4b8311a590e4/public
PRIVATE_OBJECT_DIR=/replit-objstore-034af1a5-fc4b-45f5-b69d-4b8311a590e4/.private
```

### 3. Performance Optimizations
- Build production bundle: `npm run build`
- Database indexes are automatically created by Drizzle ORM
- Static assets served through Vite's optimized build

---

## 🌐 Web Deployment (Replit)

### Step 1: Prepare for Deployment
1. Ensure all environment variables are set in Replit Secrets
2. Test all features in development mode
3. Run `npm run build` to create production build

### Step 2: Deploy on Replit
1. Click the **Deploy** button in your Replit workspace
2. Replit will automatically:
   - Build your application
   - Set up hosting with TLS/SSL
   - Configure health checks
   - Provide a `.replit.app` domain

### Step 3: Custom Domain (Optional)
1. Go to Replit Deployments dashboard
2. Click "Custom Domains"
3. Add your domain (e.g., `mandarinmaster.com`)
4. Update DNS records as instructed

---

## 📱 Mobile App Deployment

Since MandarinMaster is a web application, we'll use Progressive Web App (PWA) technology and wrappers for mobile deployment.

### Converting to PWA

#### Step 1: Add PWA Configuration
Create `public/manifest.json`:
```json
{
  "name": "MandarinMaster",
  "short_name": "MandarinMaster",
  "description": "Comprehensive Chinese Language Learning Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#10b981",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### Step 2: Add Service Worker
Create `public/service-worker.js`:
```javascript
const CACHE_NAME = 'mandarinmaster-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

#### Step 3: Register Service Worker
Add to `index.html`:
```html
<link rel="manifest" href="/manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js');
  }
</script>
```

---

## 📱 iOS App Store Deployment

### Option 1: PWA Wrapper Using Capacitor

#### Step 1: Install Capacitor
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init MandarinMaster com.yourcompany.mandarinmaster --web-dir=dist
```

#### Step 2: Build and Add iOS Platform
```bash
npm run build
npx cap add ios
npx cap sync ios
```

#### Step 3: Configure iOS Project
1. Open Xcode: `npx cap open ios`
2. Set up signing certificates in Xcode
3. Configure app capabilities (push notifications, etc.)
4. Update `Info.plist` with required permissions:
   - Microphone usage (for voice features)
   - Speech recognition

#### Step 4: App Store Submission
1. Create app in App Store Connect
2. Fill in app information:
   - App name: MandarinMaster
   - Category: Education
   - Description: Your app description
   - Keywords: chinese, mandarin, language learning, etc.
3. Upload screenshots (required sizes):
   - 6.7" (1290 × 2796)
   - 6.5" (1242 × 2688)
   - 5.5" (1242 × 2208)
   - iPad Pro 12.9" (2048 × 2732)
4. Build and archive in Xcode
5. Upload to App Store Connect
6. Submit for review

### Option 2: Use a Service (Recommended for Simplicity)
Services like **Progressier** or **PWABuilder** can wrap your PWA:
1. Visit https://www.pwabuilder.com
2. Enter your deployed Replit URL
3. Follow iOS package generation steps
4. Download the Xcode project
5. Submit to App Store

---

## 🤖 Google Play Store Deployment

### Option 1: PWA Wrapper Using Capacitor

#### Step 1: Add Android Platform
```bash
npx cap add android
npx cap sync android
```

#### Step 2: Configure Android Project
1. Open Android Studio: `npx cap open android`
2. Update `AndroidManifest.xml` with permissions:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

#### Step 3: Build APK/AAB
```bash
cd android
./gradlew assembleRelease  # For APK
./gradlew bundleRelease     # For AAB (recommended)
```

#### Step 4: Play Store Submission
1. Create app in Google Play Console
2. Fill in store listing:
   - Title: MandarinMaster
   - Short description (80 chars max)
   - Full description (4000 chars max)
   - Category: Education
   - Content rating: Everyone
3. Upload screenshots:
   - Phone: 2-8 screenshots
   - 7" tablet: up to 8 screenshots  
   - 10" tablet: up to 8 screenshots
4. Upload APK/AAB file
5. Set up pricing (free/paid)
6. Submit for review

### Option 2: Trusted Web Activity (TWA)
Google recommends TWA for PWAs:
1. Use https://www.pwabuilder.com
2. Enter your deployed URL
3. Generate Android package
4. Download signed APK
5. Upload to Play Store

---

## 🚀 Quick Deployment Path (Recommended)

### Phase 1: Web Deployment (Week 1)
1. Deploy on Replit using the Deploy button
2. Test all features on production
3. Set up custom domain if needed

### Phase 2: PWA Enhancement (Week 2)
1. Add manifest.json and service worker
2. Test PWA installation on mobile devices
3. Ensure offline functionality works

### Phase 3: App Store Deployment (Week 3-4)
1. Use PWABuilder to generate packages
2. Submit to Apple App Store
3. Submit to Google Play Store
4. Monitor review process (typically 1-7 days)

---

## 📊 Post-Deployment Monitoring

### Analytics Setup
1. Add Google Analytics or Plausible
2. Track key metrics:
   - User retention
   - Feature usage
   - Practice completion rates
   - Error rates

### Error Tracking
1. Implement Sentry or LogRocket
2. Monitor JavaScript errors
3. Track API failures
4. Monitor database performance

### User Feedback
1. Add in-app feedback form
2. Monitor app store reviews
3. Set up user support email
4. Create FAQ documentation

---

## 🔧 Maintenance & Updates

### Regular Updates
- Weekly: Bug fixes and minor improvements
- Monthly: New content and features
- Quarterly: Major feature releases

### Database Maintenance
```bash
# Backup database
pg_dump $DATABASE_URL > backup.sql

# Run migrations
npm run db:push
```

### Content Updates
- Add new vocabulary words
- Update practice questions
- Add seasonal topics
- Improve AI conversation prompts

---

## 📝 Important Notes

1. **API Keys Security**: Never commit API keys to git. Use environment variables.

2. **CORS Configuration**: Ensure your backend allows requests from mobile app domains.

3. **Performance**: Mobile apps should work offline where possible. Cache critical data.

4. **Testing**: Test on real devices before submission:
   - iOS: iPhone SE, iPhone 14, iPad
   - Android: Various screen sizes and OS versions

5. **App Store Guidelines**: 
   - Apple requires apps to be native-like (PWA wrapper helps)
   - Google Play accepts PWAs through TWA
   - Both require privacy policies

6. **Monetization Options**:
   - Freemium model with premium features
   - Subscription for unlimited hearts/XP boost
   - One-time purchase for course content
   - Ads (not recommended for education apps)

---

## 🆘 Troubleshooting

### Common Issues

**Build Failures**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

**Database Connection Issues**
- Verify DATABASE_URL is correct
- Check firewall/security group settings
- Ensure SSL mode is configured

**Mobile App Crashes**
- Check memory usage
- Verify permissions in manifest
- Test on different OS versions
- Check for JavaScript errors in console

**App Store Rejection Reasons**
- Incomplete functionality
- Crashes or bugs
- Placeholder content
- Guideline violations
- Missing privacy policy

---

## 📞 Support Resources

- **Replit Support**: https://replit.com/support
- **App Store Connect**: https://developer.apple.com/help/app-store-connect
- **Google Play Console**: https://support.google.com/googleplay/android-developer
- **PWABuilder**: https://docs.pwabuilder.com
- **Capacitor**: https://capacitorjs.com/docs

---

## ✅ Final Checklist Before Launch

- [ ] All features tested and working
- [ ] Database backed up
- [ ] API keys secured
- [ ] Performance optimized
- [ ] Mobile responsive design verified
- [ ] Privacy policy and terms of service ready
- [ ] App store assets prepared (icons, screenshots, descriptions)
- [ ] Support email configured
- [ ] Analytics tracking implemented
- [ ] Error monitoring set up
- [ ] Documentation completed
- [ ] Marketing materials ready
- [ ] Launch announcement prepared

---

**Good luck with your deployment! 🚀**