package br.com.campusestudos.banestes.evolution;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import android.os.Bundle;
import android.graphics.Color;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

/** Widgets nativos RemoteViews: dados locais reais, sem serviço ou rede. */
public class StudyWidget extends AppWidgetProvider {
    public static final String PREFS="study_evolution_widgets";
    protected boolean expanded(){ return false; }
    private static int id(Context c,String type,String name){return c.getResources().getIdentifier(name,type,c.getPackageName());}
    static String day(Calendar c){return new SimpleDateFormat("yyyy-MM-dd",Locale.US).format(c.getTime());}
    static int dayCount(JSONObject days,String key){JSONArray a=days.optJSONArray(key);return a==null?0:a.length();}
    public static int[] counts(JSONObject s,Calendar now){
        JSONObject days=s.optJSONObject("days");if(days==null)days=new JSONObject();
        int today=dayCount(days,day(now)),week=0;
        Calendar monday=(Calendar)now.clone();int diff=(monday.get(Calendar.DAY_OF_WEEK)+5)%7;monday.add(Calendar.DATE,-diff);
        for(int i=0;i<7;i++){if(dayCount(days,day(monday))>0)week++;monday.add(Calendar.DATE,1);}
        return new int[]{today,week};
    }
    @Override public void onUpdate(Context c,AppWidgetManager manager,int[] ids){for(int widget:ids)render(c,manager,widget,expanded());StreakReminder.schedule(c);}
    @Override public void onAppWidgetOptionsChanged(Context c,AppWidgetManager manager,int widget,Bundle options){render(c,manager,widget,expanded());}
    public static boolean useExpanded(boolean expanded,int width,int height){return expanded&&(width==0||width>=200)&&(height==0||height>=110);}

    public static void render(Context c,AppWidgetManager manager,int widget,boolean expanded){
        JSONObject s;try{s=new JSONObject(c.getSharedPreferences(PREFS,0).getString("snapshot","{}"));}catch(Exception e){s=new JSONObject();}
        Bundle options=manager.getAppWidgetOptions(widget);expanded=useExpanded(expanded,options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH),(int)(options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT)/Math.max(1f,c.getResources().getConfiguration().fontScale)));
        RemoteViews v=new RemoteViews(c.getPackageName(),id(c,"layout",expanded?"study_widget_expanded":"study_widget_compact"));
        int[] streak=StreakRules.calculate(s,Calendar.getInstance());String sequence=streak[0]+(streak[0]==1?" dia":" dias")+" de ofensiva";
        v.setTextViewText(id(c,"id","study_streak"),sequence);v.setContentDescription(id(c,"id","study_root"),sequence+". Recorde: "+streak[1]+" dias. Toque para estudar.");
        v.setTextColor(id(c,"id","study_streak"),Color.parseColor(streak[3]==1?"#FFCA8B":streak[2]==1?"#8CDBBE":"#B7C8D1"));
        if(expanded){v.setTextViewText(id(c,"id","study_status"),streak[3]==1?"Em risco: conclua uma etapa hoje":streak[2]==1?"✓ Ofensiva mantida hoje · Recorde: "+streak[1]:"Conclua uma etapa para começar");}
        String level=s.optString("name","Iniciante");int xp=Math.max(0,s.optInt("xp",0)),percent=Math.max(0,Math.min(100,s.optInt("percent",0)));
        v.setTextViewText(id(c,"id","study_level"),"Nível "+s.optInt("index",1)+" · "+level);
        v.setTextViewText(id(c,"id","study_xp"),xp+" XP");v.setProgressBar(id(c,"id","study_progress"),100,percent,false);
        if(expanded){int[] counts=counts(s,Calendar.getInstance());v.setTextViewText(id(c,"id","study_goal"),"Hoje: "+counts[0]+"/"+Math.max(1,s.optInt("goal",2))+" etapas · "+counts[1]+"/7 dias na semana");}
        Intent launch=c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        if(launch!=null){launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP);PendingIntent intent=PendingIntent.getActivity(c,0,launch,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);v.setOnClickPendingIntent(id(c,"id","study_root"),intent);}
        manager.updateAppWidget(widget,v);
    }
    public static void refresh(Context c){AppWidgetManager manager=AppWidgetManager.getInstance(c);for(int id:manager.getAppWidgetIds(new ComponentName(c,StudyWidget.class)))render(c,manager,id,false);for(int id:manager.getAppWidgetIds(new ComponentName(c,ExpandedStudyWidget.class)))render(c,manager,id,true);}
}
