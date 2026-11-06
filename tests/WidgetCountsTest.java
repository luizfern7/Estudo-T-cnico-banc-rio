import org.json.JSONObject;
import java.util.Calendar;
import br.com.campusestudos.banestes.evolution.StudyWidget;
public class WidgetCountsTest {
 public static void main(String[] args)throws Exception{
  JSONObject s=new JSONObject("{\"days\":{\"2026-11-01\":[\"old\"],\"2026-11-02\":[\"a\"],\"2026-11-03\":[\"b\"],\"2026-11-04\":[\"c\"],\"2026-11-05\":[\"d\"],\"2026-11-06\":[\"e\",\"f\"]}} ");
  Calendar now=Calendar.getInstance();now.set(2026,Calendar.NOVEMBER,6,12,0,0);
  int[] counts=StudyWidget.counts(s,now);if(counts[0]!=2||counts[1]!=5)throw new AssertionError("Today's steps and current week");
  now.set(2026,Calendar.NOVEMBER,9,12,0,0);counts=StudyWidget.counts(s,now);if(counts[0]!=0||counts[1]!=0)throw new AssertionError("Week rollover");
  counts=StudyWidget.counts(new JSONObject(),now);if(counts[0]!=0||counts[1]!=0)throw new AssertionError("Empty state");
  System.out.println("PASS: métricas reais dos widgets, etapas de hoje, semana iniciada na segunda-feira, virada da semana e estado vazio.");
 }
}
