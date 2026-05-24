import { Legend, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartLegendContent, ChartTooltipContent } from "@/components/application/charts/charts-base";

interface PieChartDataItem {
    name: string;
    value: number;
    className: string;
}

interface PieChartProps {
    data?: PieChartDataItem[];
}

const defaultData = [
    { name: "Series 1", value: 200, className: "text-utility-brand-600" },
    { name: "Series 2", value: 350, className: "text-utility-brand-500" },
    { name: "Series 3", value: 100, className: "text-utility-brand-400" },
    { name: "Series 4", value: 120, className: "text-utility-brand-300" },
    { name: "Series 5", value: 230, className: "text-utility-neutral-200" },
];

export const PieChartXs = ({ data = defaultData }: PieChartProps) => {
    return (
        <ResponsiveContainer initialDimension={{ width: 1, height: 1 }} height={160} className="max-w-62.5">
            <RechartsPieChart
                margin={{
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                }}
            >
                <Legend verticalAlign="top" align="right" layout="vertical" content={ChartLegendContent} />
                <Tooltip content={<ChartTooltipContent isPieChart />} />

                <Pie
                    isAnimationActive={false}
                    startAngle={-270}
                    endAngle={-630}
                    stroke="none"
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    fill="currentColor"
                    innerRadius={40}
                    outerRadius={80}
                />
            </RechartsPieChart>
        </ResponsiveContainer>
    );
};
