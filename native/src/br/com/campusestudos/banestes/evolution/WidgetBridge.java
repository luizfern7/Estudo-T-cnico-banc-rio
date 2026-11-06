package br.com.campusestudos.banestes.evolution;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import org.json.JSONObject;

/** Somente publica métricas; nunca executa comandos ou lê arquivos do dispositivo. */
public final class WidgetBridge {
    private final Context context;
    private WidgetBridge(Context c){context=c.getApplicationContext();}
    @JavascriptInterface public void update(String json){
        if(json==null||json.length()>500000)return;
        try{JSONObject value=new JSONObject(json);if(!value.has("xp")||!value.has("days"))return;
            context.getSharedPreferences(StudyWidget.PREFS,0).edit().putString("snapshot",value.toString()).apply();
            new Handler(Looper.getMainLooper()).post(new Runnable(){@Override public void run(){StudyWidget.refresh(context);}});
        }catch(Exception ignored){}
    }
    public static void install(WebView web){web.addJavascriptInterface(new WidgetBridge(web.getContext()),"StudyWidgets");}
}
