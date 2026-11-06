package br.com.campusestudos.banestes.evolution;
import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.content.pm.PackageManager;
import org.json.JSONObject;
import java.util.Calendar;

/** Alarmes inexatos locais, opcionais: não exige permissão de alarme exato. */
public final class StreakReminder extends BroadcastReceiver {
    static final String CHANNEL="study_streak";
    static SharedPreferences prefs(Context c){return c.getSharedPreferences(StudyWidget.PREFS,0);}
    static PendingIntent alarm(Context c){return PendingIntent.getBroadcast(c,431,new Intent(c,StreakReminder.class).setAction("br.com.campusestudos.banestes.STREAK_REMINDER"),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
    public static void schedule(Context c){AlarmManager manager=(AlarmManager)c.getSystemService(Context.ALARM_SERVICE);if(manager==null)return;
        if(!prefs(c).getBoolean("reminders",false)){manager.cancel(alarm(c));return;}
        Calendar next=Calendar.getInstance();next.set(Calendar.HOUR_OF_DAY,20);next.set(Calendar.MINUTE,0);next.set(Calendar.SECOND,0);next.set(Calendar.MILLISECOND,0);if(next.getTimeInMillis()<=System.currentTimeMillis())next.add(Calendar.DATE,1);
        manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,next.getTimeInMillis(),alarm(c));
    }
    public static void setEnabled(Context c,boolean enabled){boolean old=prefs(c).getBoolean("reminders",false);prefs(c).edit().putBoolean("reminders",enabled).apply();if(!enabled){NotificationManager n=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);if(n!=null){n.cancel(432);n.cancel(433);}}if(old!=enabled)schedule(c);}
    static boolean notify(Context c,int id,String title,String message){
        if(!prefs(c).getBoolean("reminders",false))return false;
        if(Build.VERSION.SDK_INT>=33&&c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)return false;
        NotificationManager manager=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);if(manager==null)return false;
        if(Build.VERSION.SDK_INT>=24&&!manager.areNotificationsEnabled())return false;
        if(Build.VERSION.SDK_INT>=26)manager.createNotificationChannel(new NotificationChannel(CHANNEL,"Ofensiva de estudos",NotificationManager.IMPORTANCE_DEFAULT));
        Intent launch=c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());if(launch==null)return false;
        PendingIntent action=PendingIntent.getActivity(c,432,launch,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b=Build.VERSION.SDK_INT>=26?new Notification.Builder(c,CHANNEL):new Notification.Builder(c);
        int icon=c.getResources().getIdentifier("study_flame_mono","drawable",c.getPackageName());
        b.setSmallIcon(icon).setContentTitle(title).setContentText(message).setStyle(new Notification.BigTextStyle().bigText(message)).setContentIntent(action).setAutoCancel(true).setOnlyAlertOnce(true);
        manager.notify(id,b.build());return true;
    }
    public static void milestone(Context c,JSONObject snapshot){int[] streak=StreakRules.calculate(snapshot,Calendar.getInstance());NotificationManager manager=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);if(streak[3]!=1&&manager!=null)manager.cancel(432);
        if(streak[2]!=1||!StreakRules.milestone(streak[0]))return;String key=StudyWidget.day(Calendar.getInstance())+":"+streak[0];if(key.equals(prefs(c).getString("lastMilestone","")))return;
        if(notify(c,433,"🔥 "+streak[0]+(streak[0]==1?" dia":" dias")+" de ofensiva!","Você manteve sua rotina de estudos. Parabéns pela dedicação!"))prefs(c).edit().putString("lastMilestone",key).apply();
    }
    @Override public void onReceive(Context c,Intent intent){
        try{if(intent!=null&&"br.com.campusestudos.banestes.STREAK_REMINDER".equals(intent.getAction())){
            JSONObject snapshot=new JSONObject(prefs(c).getString("snapshot","{}"));int[] streak=StreakRules.calculate(snapshot,Calendar.getInstance());String today=StudyWidget.day(Calendar.getInstance());if(streak[3]!=1){NotificationManager n=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);if(n!=null)n.cancel(432);}
            if(streak[3]==1&&!today.equals(prefs(c).getString("lastRisk",""))&&notify(c,432,"🔥 Mantenha sua ofensiva","Conclua uma etapa hoje para manter seus "+streak[0]+" dias consecutivos."))prefs(c).edit().putString("lastRisk",today).apply();
        }}catch(Exception ignored){}finally{schedule(c);StudyWidget.refresh(c);}
    }
}
