import org.json.JSONObject;
import org.json.JSONArray;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Calendar;
import java.util.TimeZone;
import br.com.campusestudos.banestes.evolution.StreakRules;
import br.com.campusestudos.banestes.evolution.StudyWidget;
public class StreakNativeTest {
 public static void main(String[] args)throws Exception{
  JSONArray cases=new JSONArray(new String(Files.readAllBytes(Paths.get(args[0])),"UTF-8"));
  for(int i=0;i<cases.length();i++){
   JSONObject c=cases.getJSONObject(i);String[] date=c.getString("today").split("-");
   for(String zone:new String[]{"UTC","America/Sao_Paulo","America/New_York"}){
    Calendar now=Calendar.getInstance(TimeZone.getTimeZone(zone));now.set(Integer.parseInt(date[0]),Integer.parseInt(date[1])-1,Integer.parseInt(date[2]),12,0,0);
    int[] actual=StreakRules.calculate(c,now);JSONArray expected=c.getJSONArray("expected");
    for(int j=0;j<4;j++)if(actual[j]!=expected.getInt(j))throw new AssertionError(c.getString("name")+" "+zone+" field "+j+" "+actual[j]);
   }
  }
  if(StudyWidget.useExpanded(true,160,180))throw new AssertionError("Narrow widget must use compact layout");
  if(StudyWidget.useExpanded(true,260,90))throw new AssertionError("Short widget must use compact layout");
  if(!StudyWidget.useExpanded(true,280,160))throw new AssertionError("Expanded widget");
  if(StudyWidget.useExpanded(false,280,160))throw new AssertionError("Compact provider");
  if(!StreakRules.milestone(7)||StreakRules.milestone(8))throw new AssertionError("Milestones");
  System.out.println("PASS: 12 casos nativos em 3 fusos horários, marcos e seleção responsiva dos layouts.");
 }
}
