"use client";

import React, { useState, ReactNode } from "react";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

interface AccordionItem {
  id: string | number;
  title: ReactNode;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
}

export default function Accordion({ items, className = "" }: AccordionProps) {
  const [openItem, setOpenItem] = useState<string | number | null>(null);

  const toggleItem = (id: string | number) => {
    setOpenItem(openItem === id ? null : id);
  };

  return (
    <div className={`overflow-hidden rounded-lg border dark:border-0 ${className}`}>
      {items.map((item) => {
        const isOpen = openItem === item.id;
        return (
          <div key={item.id} className="border-b last:border-b-0">
            <button
              onClick={() => toggleItem(item.id)}
              className="flex w-full items-center justify-between bg-lightblue px-4 py-2 focus:outline-none dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <span className="text-primary dark:text-gray-100 w-full">
                {item.title}
              </span>
              {isOpen ? (
                <IoIosArrowUp className="text-gray-700 dark:text-gray-300" />
              ) : (
                <IoIosArrowDown className="text-gray-700 dark:text-gray-300" />
              )}
            </button>
            {isOpen && (
              <div className="bg-white px-4 py-2 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
