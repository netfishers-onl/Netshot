import { useColor } from "@/theme";
import { SystemStyleObject, chakra } from "@chakra-ui/react";

type BrandProps = {
  mode?: "dark" | "light";
  sx?: SystemStyleObject;
};

export default function Brand(props: BrandProps) {
  const { mode = "light", ...other } = props;
  const color = useColor(mode === "light" ? "black" : "white");
  const green = useColor("green.500");

  return (
    <chakra.svg
      width="132px"
      height="37px"
      viewBox="0 0 132 37"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...other}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M25.4242 6.45447L23.8555 4.88577C21.2564 2.28667 17.0424 2.28667 14.4433 4.88577L8.16846 11.1606C5.56934 13.7597 5.56934 17.9736 8.16846 20.5727V20.5727C9.03483 21.4391 10.4395 21.4391 11.3059 20.5727L25.4242 6.45447ZM8.16846 29.9849L9.73717 31.5536C12.3363 34.1527 16.5503 34.1527 19.1494 31.5536L25.4242 25.2788C28.0234 22.6797 28.0234 18.4657 25.4242 15.8666V15.8666C24.5579 15.0003 23.1532 15.0003 22.2868 15.8666L8.16846 29.9849Z"
        fill={green}
      />
      <path
        d="M41.6374 29.2227V10.1881H44.9917L53.8301 24.8301H53.8834V10.1881H56.8384V29.2227H53.4841L44.619 14.5807H44.5658V29.2227H41.6374ZM65.8474 29.622C61.5346 29.622 59.1387 26.5605 59.1387 22.4075C59.1387 18.148 61.6944 15.2196 65.8474 15.2196C69.9737 15.2196 72.2898 17.935 72.2898 22.1413C72.2898 22.514 72.2898 22.9133 72.2632 23.1263H61.8275C61.8807 25.4157 63.2118 27.4922 65.9006 27.4922C68.2966 27.4922 69.2017 25.9482 69.4679 25.043H72.1035C71.4113 27.652 69.4147 29.622 65.8474 29.622ZM65.7675 17.3494C63.5845 17.3494 61.9872 18.8402 61.8275 21.0764H69.5478C69.5478 18.9467 68.0836 17.3494 65.7675 17.3494ZM73.274 15.6456H75.244V11.2796H77.8529V15.6456H80.4619V17.8019H77.8529V25.469C77.8529 26.9066 78.2523 27.226 79.3704 27.226C79.7963 27.226 80.0093 27.1994 80.4885 27.1195V29.2227C79.7963 29.3558 79.397 29.3824 78.8113 29.3824C76.6017 29.3824 75.244 28.5305 75.244 25.3891V17.8019H73.274V15.6456ZM88.3292 21.0232C90.805 21.6088 93.5205 22.3276 93.5205 25.3625C93.5205 27.9981 91.4972 29.5954 87.9299 29.5954C83.8035 29.5954 81.7536 27.4656 81.6738 24.697H84.3093C84.4424 26.2676 85.3742 27.4922 87.9033 27.4922C90.1927 27.4922 90.805 26.4806 90.805 25.4956C90.805 23.7918 88.9948 23.6055 87.2377 23.2328C84.8684 22.7003 82.153 21.9815 82.153 19.1596C82.153 16.8169 84.0431 15.2462 87.3442 15.2462C91.0446 15.2462 92.8283 17.2429 93.0146 19.5856H90.3791C90.1927 18.5473 89.6603 17.3494 87.3708 17.3494C85.6404 17.3494 84.8684 18.0415 84.8684 19.0531C84.8684 20.4641 86.3858 20.5706 88.3292 21.0232ZM104.548 20.5173C104.548 18.7071 103.749 17.4825 101.806 17.4825C99.5698 17.4825 98.1323 18.8402 98.1323 20.89V29.2227H95.5233V10.1881H98.1323V17.3494H98.1855C98.9043 16.3111 100.315 15.2462 102.658 15.2462C105.16 15.2462 107.184 16.6838 107.184 19.7986V29.2227H104.548V20.5173ZM116.025 29.622C111.792 29.622 109.236 26.6936 109.236 22.4341C109.236 18.2013 111.792 15.2196 116.025 15.2196C120.258 15.2196 122.814 18.1746 122.814 22.4075C122.814 26.667 120.258 29.622 116.025 29.622ZM116.025 27.4656C118.794 27.4656 120.098 25.256 120.098 22.4341C120.098 19.5856 118.794 17.4026 116.025 17.4026C113.23 17.4026 111.952 19.5856 111.952 22.4341C111.952 25.256 113.23 27.4656 116.025 27.4656ZM123.788 15.6456H125.758V11.2796H128.367V15.6456H130.976V17.8019H128.367V25.469C128.367 26.9066 128.766 27.226 129.884 27.226C130.31 27.226 130.523 27.1994 131.002 27.1195V29.2227C130.31 29.3558 129.911 29.3824 129.325 29.3824C127.115 29.3824 125.758 28.5305 125.758 25.3891V17.8019H123.788V15.6456Z"
        fill={color}
      />
    </chakra.svg>
  );
}
