package onl.netfishers.netshot;

import org.junit.jupiter.api.Assertions;

import java.util.Calendar;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.quartz.JobKey;

import onl.netfishers.netshot.work.Task;
import onl.netfishers.netshot.work.Task.ScheduleType;

public class TaskTest {

	@BeforeAll
	static void initNetshot() {
		Netshot.initConfig();
	}

	@Nested
	@DisplayName("Next execution time of tasks")
	class TaskExecutionTimeTest {

		Task task = new Task() {
			@Override
			public JobKey getIdentity() {
				return null;
			}

			@Override
			public String getTaskDescription() {
				return null;
			}

			@Override
			public void run() {
			}
		};

		@Test
		@DisplayName("Next execution time of ASAP task")
		void asapTask() {
			task.setScheduleType(ScheduleType.ASAP);
			Assertions.assertNull(task.getNextExecutionDate(),
				"Next execution date for ASAP task is not null");
		}

		@Test
		@DisplayName("Next execution time of AT task")
		void atTask() {
			Calendar inSixteenMinutes = Calendar.getInstance();
			inSixteenMinutes.add(Calendar.MINUTE, 16);
			task.setScheduleType(ScheduleType.AT);
			task.setScheduleReference(inSixteenMinutes.getTime());
			Assertions.assertEquals(task.getNextExecutionDate(), inSixteenMinutes.getTime(),
				"Next execution date for AT task is not the schedule reference");
		}

		@Test
		@DisplayName("Next execution time of EVERY 2 HOURS imminent task")
		void everyTwoHoursImminentTask() {
			Calendar inTenSeconds = Calendar.getInstance();
			inTenSeconds.add(Calendar.SECOND, 10);
			task.setScheduleReference(inTenSeconds.getTime());
			task.setScheduleType(ScheduleType.HOURLY);
			task.setScheduleFactor(2);
			Calendar inTwoHours = (Calendar) inTenSeconds.clone();
			inTwoHours.add(Calendar.HOUR, 2);
			Assertions.assertEquals(task.getNextExecutionDate(), inTwoHours.getTime(),
				"Next execution date for EVERY 2 HOURS task is not in two hours");
		}

		@Test
		@DisplayName("Next execution time of EVERY 2 HOURS task")
		void everyTwoHoursTask() {
			Calendar inEightySeconds = Calendar.getInstance();
			inEightySeconds.add(Calendar.SECOND, 80);
			task.setScheduleReference(inEightySeconds.getTime());
			task.setScheduleType(ScheduleType.HOURLY);
			task.setScheduleFactor(2);
			Assertions.assertEquals(task.getNextExecutionDate(), inEightySeconds.getTime(),
				"Next execution date for EVERY 2 HOURS task is not now");
		}

		@Test
		@DisplayName("Next execution time of EVERY WEEK task")
		void everyWeekTask() {
			Calendar inTenSeconds = Calendar.getInstance();
			inTenSeconds.add(Calendar.SECOND, 10);
			task.setScheduleReference(inTenSeconds.getTime());
			task.setScheduleType(ScheduleType.WEEKLY);
			task.setScheduleFactor(1);
			Calendar inOneWeek = (Calendar) inTenSeconds.clone();
			inOneWeek.add(Calendar.WEEK_OF_YEAR, 1);
			Assertions.assertEquals(task.getNextExecutionDate(), inOneWeek.getTime(),
				"Next execution date for EVERY WEEK task is not now");
		}

		@Test
		@DisplayName("Next execution time of EVERY SIX MONTHS task")
		void everySixMonths() {
			Calendar inTenSeconds = Calendar.getInstance();
			inTenSeconds.add(Calendar.SECOND, 10);
			task.setScheduleReference(inTenSeconds.getTime());
			task.setScheduleType(ScheduleType.MONTHLY);
			task.setScheduleFactor(6);
			Calendar inSixMonths = (Calendar) inTenSeconds.clone();
			inSixMonths.add(Calendar.MONTH, 6);
			Assertions.assertEquals(task.getNextExecutionDate(), inSixMonths.getTime(),
				"Next execution date for EVERY SIX MONTHS task is not now");
		}

		@Test
		@DisplayName("Next execution time of EVERY FIRST OF THE MONTH task")
		void everyFirstOfTheMonth() {
			Calendar reference = Calendar.getInstance();
			reference.set(2016, 01, 01, 16, 00, 00);
			reference.set(Calendar.MILLISECOND, 0);
			task.setScheduleReference(reference.getTime());
			task.setScheduleType(ScheduleType.MONTHLY);
			task.setScheduleFactor(1);
			Calendar nextFirst = Calendar.getInstance();
			nextFirst.set(Calendar.DAY_OF_MONTH, 1);
			nextFirst.set(Calendar.HOUR_OF_DAY, 16);
			nextFirst.set(Calendar.MINUTE, 0);
			nextFirst.set(Calendar.SECOND, 0);
			nextFirst.set(Calendar.MILLISECOND, 0);
			if (nextFirst.before(Calendar.getInstance())) {
				nextFirst.add(Calendar.MONTH, 1);
			}
			Assertions.assertEquals(task.getNextExecutionDate(), nextFirst.getTime(),
				"Next execution date for EVERY FIRST OF THE MONTH is not next first of the month");
		}

	}
}
