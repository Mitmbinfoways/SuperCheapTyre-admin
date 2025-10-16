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
        icon: Icons.ShoppingCartIcon,
        items: [
          {
            title: "Products",
            url: "/products",
          },
          {
            title: "Create Product",
            url: "/create-product",
          },
        ],
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
        title: "Brands",
        url: "/brands",
        icon: Icons.PackageIcon,
        items: [
          {
            title: "Brands",
            url: "/brands",
          },
          {
            title: "Create Brand",
            url: "/create-brand",
          },
        ],
      },
      {
        title: "Blog",
        url: "/blog",
        icon: Icons.Alphabet,
        items: [
          {
            title: "Blog",
            url: "/blog",
          },
          {
            title: "Create Blog",
            url: "/create-blog",
          },
        ],
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
        title: "Measurements",
        url: "/measurements",
        icon: Icons.PackageIcon,
        items: [
          {
            title: "Measurements",
            url: "/measurements/show",
          },
          {
            title: "Add Measurement",
            url: "/measurements",
          },
        ],
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
