import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Icons.FourCircle,
        items: [],
      },
      {
        title: "Products",
        url: "/products",
        icon: Icons.ShoppingCartIcon,
        items: [],
      },
      {
        title: "Create Product",
        url: "/create-product",
        icon: Icons.PlusCircleIcon,
        items: [],
      },
      {
        title: "Measurements",
        url: "/measurements",
        icon: Icons.PackageIcon,
        items: [
          {
            title: "Add Measurement",
            url: "/measurements",
            icon: Icons.PlusCircleIcon,
          },
          {
            title: "Show Measurements",
            url: "/measurements/show",
            icon: Icons.EyeIcon,
          },
        ],
      },
      {
        title: "Brands",
        url: "/brands",
        icon: Icons.PackageIcon,
        items: [],
      },
      {
        title: "Create Brand",
        url: "/create-brand",
        icon: Icons.PlusCircleIcon,
        items: [],
      },
      {
        title: "Blog",
        url: "/blog",
        icon: Icons.Alphabet,
        items: [],
      },
      {
        title: "Create Blog",
        url: "/create-blog",
        icon: Icons.PlusCircleIcon,
        items: [],
      },
      {
        title: "Appointment",
        url: "/appointment",
        icon: Icons.CalendarDaysIcon,
        items: [],
      },
      {
        title: "Orders",
        url: "/orders",
        icon: Icons.OrdersIcon,
        items: [],
      },
      {
        title: "Add Holidays",
        url: "/add-holidays",
        icon: Icons.CalendarPlusIcon,
        items: [],
      },
      {
        title: "Manage Employee",
        url: "/add-employee",
        icon: Icons.UserPlusIcon,
        items: [],
      },
      {
        title: "Manage TimeSlot",
        url: "/add-timeslot",
        icon: Icons.ClockIcon,
        items: [],
      },
      {
        title: "Manage Query",
        url: "/query",
        icon: Icons.ChatBubbleLeftRightIcon,
        items: [],
      },
    ],
  },
];