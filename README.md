# 2D ဒိုင် စာရင်းကိုင် & Limit မန်နေဂျာ (Android App & Web)

2D စလစ်တွက်ချက်ရေး၊ ထိုးကြေး Limit စီမံခန့်ခွဲမှုနှင့် နေ့စဉ်ငွေစာရင်းချုပ် စနစ် (Android APK အလိုအလျောက် ထုတ်လုပ်ပေးသော စနစ်ပါဝင်သည်)။

---

## 📱 Android APK ဒေါင်းလုဒ်ဆွဲနည်း (GitHub ပေါ်မှ)

GitHub ပေါ်သို့ Code များ Push တင်လိုက်သည်နှင့် **GitHub Actions** မှ Android APK ဖိုင်ကို အလိုအလျောက် Build လုပ်ပေးပါသည်။

### နည်းလမ်း (၁) - Releases စာမျက်နှာမှ APK တိုက်ရိုက်ဒေါင်းနည်း (အလွယ်ဆုံး)
1. ဤ GitHub Repository ၏ ညာဘက်ခြမ်းရှိ **Releases** သို့ သွားပါ။
2. နောက်ဆုံးထွက် **`2D-Ledger-Android-App v1.0.x`** အောက်ရှိ **`app-debug.apk`** ဖိုင်ကို နှိပ်ပြီး ဖုန်းထဲသို့ တိုက်ရိုက် ဒေါင်းလုဒ်ဆွဲပါ။
3. ဒေါင်းလုဒ်ပြီးပါက နှိပ်၍ **Install** ပြုလုပ်ပါ။

### နည်းလမ်း (၂) - Actions Tab မှ Artifact အဖြစ် ဒေါင်းနည်း
1. GitHub ၏ အပေါ် Menu ရှိ **Actions** tab ကို နှိပ်ပါ။
2. နောက်ဆုံးပြီးစီးသွားသော **"Build & Release Android APK"** workflow run ကို နှိပ်ပါ။
3. အောက်ဆုံးရှိ **Artifacts** အောက်မှ **`2D-Ledger-Android-App`** ကို နှိပ်၍ ဒေါင်းလုဒ်ဆွဲပါ။

---

## 💻 Local ကွန်ပျူတာပေါ်တွင် စမ်းသပ်လည်ပတ်ရန်

```bash
# 1. Dependency များ install လုပ်ခြင်း
npm install

# 2. Development Server စတင်ခြင်း
npm run dev
```
Browser တွင် `http://localhost:3000` ဖြင့် ကြည့်ရှုနိုင်ပါသည်။
