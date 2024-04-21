import { useColor } from "@/theme";
import { Box, BoxProps } from "@chakra-ui/react";
import NativeChart, {
  ChartConfiguration,
  ChartTypeRegistry,
} from "chart.js/auto";
import mergeWith from "lodash.mergewith";
import { useLayoutEffect, useMemo, useRef } from "react";

export type ChartProps<T extends keyof ChartTypeRegistry = "line"> = {
  config: ChartConfiguration<T>;
} & BoxProps;

export default function Chart<T extends keyof ChartTypeRegistry = "line">(
  props: ChartProps<T>
) {
  const { config, ...other } = props;
  const ctx = useRef<HTMLCanvasElement>();
  const chart = useRef<NativeChart>();
  const green500 = useColor("green.500");
  const greyColor = useColor("grey.400");
  const grey100 = useColor("grey.100");

  const defaultConfig = useMemo(() => {
    return {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            backgroundColor: green500,
            // borderColor: green500,
            data: [],
            borderWidth: 1,
            cubicInterpolationMode: "monotone",
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          axis: "xy",
          mode: "nearest",
          intersect: false,
        },
        scales: {
          x: {
            ticks: {
              padding: 12,
              color: greyColor,
              align: "inner",
              font: {
                family: "SF Pro",
                weight: 500,
                size: 12,
              },
            },
            grid: {
              color: grey100,
              // tickLength: 0,
              // drawBorder: false,
              lineWidth: 1,
            },
          },
          y: {
            min: 0,
            ticks: {
              precision: 0,
              //display: false,
            },
            grid: {
              // tickLength: 0,
              // drawBorder: false,
              lineWidth: 1,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          /* tooltip: {
            callbacks: {
              title: () => null,
            },
          }, */
        },
      },
    } as ChartConfiguration;
  }, [green500, grey100, greyColor]);

  useLayoutEffect(() => {
    chart.current = new NativeChart(
      ctx.current,
      mergeWith(defaultConfig, config)
    );

    return () => {
      chart.current.destroy();
      chart.current = null;
    };
  }, [ctx, chart, config, defaultConfig]);

  return <Box as="canvas" ref={ctx} {...other} />;
}
