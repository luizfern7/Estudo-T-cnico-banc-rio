package br.com.campusestudos.banestes.evolution;
import org.json.JSONObject;
import java.util.Calendar;
import java.util.Iterator;
import java.util.TreeSet;
import java.util.TimeZone;
import java.text.SimpleDateFormat;
import java.util.Locale;

/** Regras de datas civis, iguais ao progression.js, testáveis sem aparelho. */
public final class StreakRules {
    private static Long ordinal(String value){
        if(value==null||!value.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}"))return null;
        try{SimpleDateFormat format=new SimpleDateFormat("yyyy-MM-dd",Locale.US);format.setLenient(false);format.setTimeZone(TimeZone.getTimeZone("UTC"));return format.parse(value).getTime()/86400000L;}catch(Exception e){return null;}
    }
    /** current, best, studiedToday, atRisk */
    public static int[] calculate(JSONObject snapshot,Calendar now){
        JSONObject days=snapshot.optJSONObject("days");if(days==null)days=new JSONObject();
        SimpleDateFormat format=new SimpleDateFormat("yyyy-MM-dd",Locale.US);format.setTimeZone(now.getTimeZone());
        long today=ordinal(format.format(now.getTime()));TreeSet<Long> dates=new TreeSet<Long>();
        for(Iterator<String> keys=days.keys();keys.hasNext();){String key=keys.next();Long n=ordinal(key);if(n!=null&&n<=today&&days.optJSONArray(key)!=null&&days.optJSONArray(key).length()>0)dates.add(n);}
        boolean studied=dates.contains(today);long cursor=studied?today:today-1;int current=0;
        while(dates.contains(cursor)){current++;cursor--;}
        int best=0,run=0;Long previous=null;for(Long date:dates){run=previous!=null&&date==previous+1?run+1:1;best=Math.max(best,run);previous=date;}
        return new int[]{current,best,studied?1:0,!studied&&current>0?1:0};
    }
    public static boolean milestone(int days){return days==1||days==3||days==7||days==14||days==30||days==60||days==100||days==365;}
}
