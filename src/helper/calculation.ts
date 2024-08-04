import moment from "moment";

export const calculateMonth = (date) => {
  const currentDate = moment(date, "DD/MM/YYYY");

  const formatter = new Intl.DateTimeFormat("en", { month: "short" });

  const currentMonth = formatter.format(currentDate.toDate());
  const currentYear = currentDate.year();

  // Get the previous month
  const previousMonthDate = moment(currentDate).subtract(1, "month");
  const previousMonth = formatter.format(previousMonthDate.toDate());
  const previousMonthYear = previousMonthDate.year();

  const lastFridayPreviousMonth = getLastFriday(previousMonthDate);
  const lastThursdayCurrentMonth = getLastThursday(currentDate);

  let month;
  if (currentDate.isSameOrBefore(lastThursdayCurrentMonth)) {
    if (currentYear === previousMonthYear) {
      month = `${previousMonth}-${currentMonth} (${currentYear})`;
    } else {
      month = `${previousMonth}-${currentMonth} (${previousMonthYear}-${currentYear
        .toString()
        .slice(2)})`;
    }
  } else {
    const nextMonthDate = moment(currentDate).add(1, "month");
    const nextMonth = formatter.format(nextMonthDate.toDate());
    const nextMonthYear = nextMonthDate.year();

    if (currentYear === nextMonthYear) {
      month = `${currentMonth}-${nextMonth} (${currentYear})`;
    } else {
      month = `${currentMonth}-${nextMonth} (${currentYear}-${nextMonthYear
        .toString()
        .slice(2)})`;
    }
  }

  return {
    currentDate: currentDate.toDate(),
    lastFridayPreviousMonth,
    lastThursdayCurrentMonth,
    month,
  };
};

function getLastFriday(date) {
  let lastDayOfMonth = moment(date).endOf("month");

  // Find the last Friday
  while (lastDayOfMonth.day() !== 5) {
    lastDayOfMonth.subtract(1, "day");
  }
  return lastDayOfMonth;
}

function getLastThursday(date) {
  let lastDayOfMonth = moment(date).endOf("month");

  // Find the last Thursday
  while (lastDayOfMonth.day() !== 4) {
    lastDayOfMonth.subtract(1, "day");
  }
  return lastDayOfMonth;
}

export const calculateTotalDays = (date) => {
  let { lastFridayPreviousMonth, lastThursdayCurrentMonth, month } =
    calculateMonth(date);
  console.log(lastFridayPreviousMonth, lastThursdayCurrentMonth, month);

  const totalDays =
    lastThursdayCurrentMonth.diff(lastFridayPreviousMonth, "days") + 1;
  return { totalDays, month };
};

export const calculateROI = (capital, pnl) => {
  let ROI = (pnl / capital) * 100;
  return ROI;
};

export const overallPNL = (pnlList) => {
  const today = moment().startOf("day");
  const startOfWeek = moment().startOf("week");
  const startOfMonth = moment().startOf("month");
  let totals = pnlList.reduce(
    (acc, item, index) => {
      const itemDate = moment(item.date, "DD/MM/YYYY");
      acc.totalPnlValue += item.pnlValue;
      acc.totalROI += item.ROI;

      // Update latest profit/loss
      if (item.pnlValue >= 0) {
        acc.latestProfit = item.pnlValue;
      } else {
        acc.latestLoss = item.pnlValue;
      }

      // Update latest max profit and reset maxLossAfterLatestMaxProfit
      if (item.pnlValue > acc.latestMaxProfit) {
        acc.latestMaxProfit = item.pnlValue;
        acc.maxLossAfterLatestMaxProfit = 0;
      }

      // Update max loss after latest max profit
      if (item.pnlValue < acc.maxLossAfterLatestMaxProfit) {
        acc.maxLossAfterLatestMaxProfit = item.pnlValue;
      }

      // Calculate DD
      acc.DD = acc.latestMaxProfit - acc.latestLoss;

      // Calculate MDD
      const currentMDD = acc.latestMaxProfit - acc.maxLossAfterLatestMaxProfit;
      if (currentMDD > acc.MDD) {
        acc.MDD = currentMDD;
      }

      // Other calculations remain the same
      if (item.pnlValue > 0) {
        acc.winDays++;
        acc.totalWinProfit += item.pnlValue;
        acc.currentWinStreak++;
        acc.currentLossStreak = 0;
        if (acc.currentWinStreak > acc.maxWinStreak) {
          acc.maxWinStreak = acc.currentWinStreak;
        }
        if (item.pnlValue > acc.maxProfit) {
          acc.maxProfit = item.pnlValue;
        }
      } else {
        acc.lossDays++;
        acc.totalLoss += item.pnlValue;
        acc.currentLossStreak++;
        acc.currentWinStreak = 0;
        if (acc.currentLossStreak > acc.maxLossStreak) {
          acc.maxLossStreak = acc.currentLossStreak;
        }
        if (item.pnlValue < acc.maxLoss) {
          acc.maxLoss = item.pnlValue;
        }
      }

      // Calculate today's PnL
      if (itemDate.isSame(today, "day")) {
        acc.todayPNL += item.pnlValue;
      }
      // Calculate current week's PnL
      if (itemDate.isSameOrAfter(startOfWeek)) {
        acc.currentWeekPNL += item.pnlValue;
      }
      // Calculate current month's PnL
      if (itemDate.isSameOrAfter(startOfMonth)) {
        acc.currentMonthPNL += item.pnlValue;
      }

      return acc;
    },
    {
      totalPnlValue: 0,
      totalROI: 0,
      winDays: 0,
      lossDays: 0,
      totalWinProfit: 0,
      totalLoss: 0,
      maxProfit: -Infinity,
      maxLoss: 0,
      currentWinStreak: 0,
      maxWinStreak: 0,
      currentLossStreak: 0,
      maxLossStreak: 0,
      latestProfit: 0,
      latestLoss: 0,
      todayPNL: 0,
      currentWeekPNL: 0,
      currentMonthPNL: 0,
      latestMaxProfit: 0,
      maxLossAfterLatestMaxProfit: 0,
      MDD: 0,
      DD: 0,
    }
  );

  return totals;
};
