package br.com.campusestudos.banestes.evolution;
import android.content.Context;
import android.content.ContextWrapper;
import android.app.Activity;
import android.os.Build;
import android.Manifest;
import android.content.pm.PackageManager;
import java.lang.ref.WeakReference;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import org.json.JSONObject;

/** Somente publica métricas; nunca executa comandos ou lê arquivos do dispositivo. */
public final class WidgetBridge {
    private final Context context;
    private final WeakReference<Activity> activity;
    private WidgetBridge(Context c){context=c.getApplicationContext();Context cursor=c;while(cursor instanceof ContextWrapper&&!(cursor instanceof Activity)){Context next=((ContextWrapper)cursor).getBaseContext();if(next==cursor)break;cursor=next;}activity=new WeakReference<Activity>(cursor instanceof Activity?(Activity)cursor:null);}
    @JavascriptInterface public void syncReminderPreference(boolean enabled){StreakReminder.setEnabled(context,enabled);}
    @JavascriptInterface public void setRemindersEnabled(boolean enabled){StreakReminder.setEnabled(context,enabled);if(enabled){new Handler(Looper.getMainLooper()).post(new Runnable(){@Override public void run(){Activity a=activity.get();if(a!=null&&!a.isFinishing()&&Build.VERSION.SDK_INT>=33&&a.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)a.requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},435);StreakReminder.schedule(context);}});}}

    @JavascriptInterface public void update(String json){
        if(json==null||json.length()>500000)return;
        try{JSONObject value=new JSONObject(json);if(!value.has("xp")||!value.has("days"))return;
            context.getSharedPreferences(StudyWidget.PREFS,0).edit().putString("snapshot",value.toString()).apply();
            new Handler(Looper.getMainLooper()).post(new Runnable(){@Override public void run(){StudyWidget.refresh(context);StreakReminder.milestone(context,value);}});
        }catch(Exception ignored){}
    }
    public static void install(WebView web){web.addJavascriptInterface(new WidgetBridge(web.getContext()),"StudyWidgets");}
}
