import { Document, Schema, Types, model } from "mongoose";

export interface IPortfolio extends Document {
  _id: string;
  userId: Types.ObjectId;
  month: string;
  pnlList: {
    date: string;
    pnlValue: number;
    ROI: number;
  }[];
  totalCapital: string;
  overallPNL: string;
  createdAt: Date;
  updatedAt: Date;
  overallROI: string;
  winDays: number;
  winRation: number;
  avgProfit: number;
  totalProfit: number;
  maxProfit: number;
  todayPNL: number;
  currentWeekPNL: number;
  currentMonthPNL: number;
  currentDD: number;
  lossDays: number;
  lossRation: number;
  avgLoss: number;
  totalLoss: number;
  maxLoss: number;
  winStreak: number;
  lossStreak: number;
  MDD: number;
  MDDRatio: number;
  riskReward: number;
  expectancy: number;
}

const portfolio = new Schema<IPortfolio>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    month: {
      type: String,
    },
    pnlList: [
      {
        date: String,
        pnlValue: Number,
        ROI: Number,
      },
    ],
    totalCapital: {
      type: String,
      default: "",
    },
    overallPNL: {
      type: String,
      default: "",
    },
    overallROI: {
      type: String,
      default: "",
    },
    winDays: {
      type: Number,
      default: 0,
    },
    winRation: {
      type: Number,
      default: 0,
    },
    avgProfit: {
      type: Number,
      default: 0,
    },
    totalProfit: {
      type: Number,
      default: 0,
    },
    maxProfit: {
      type: Number,
      default: 0,
    },
    todayPNL: {
      type: Number,
      default: 0,
    },
    currentWeekPNL: {
      type: Number,
      default: 0,
    },
    currentMonthPNL: {
      type: Number,
      default: 0,
    },
    currentDD: {
      type: Number,
      default: 0,
    },
    lossDays: {
      type: Number,
      default: 0,
    },
    lossRation: {
      type: Number,
      default: 0,
    },
    avgLoss: {
      type: Number,
      default: 0,
    },
    totalLoss: {
      type: Number,
      default: 0,
    },
    maxLoss: {
      type: Number,
      default: 0,
    },
    winStreak: {
      type: Number,
      default: 0,
    },
    lossStreak: {
      type: Number,
      default: 0,
    },
    MDD: {
      type: Number,
      default: 0,
    },
    MDDRatio: {
      type: Number,
      default: 0,
    },
    riskReward: {
      type: Number,
      default: 0,
    },
    expectancy: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const PortfolioModel = model<IPortfolio>("portfolios", portfolio);
