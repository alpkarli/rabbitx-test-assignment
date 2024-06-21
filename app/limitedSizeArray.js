import { useState } from "react";

export const useLimitedSizeArray = (limit) => {
    const [data, setData] = useState([]);

    const push = (newData) => {
        setData((prevData) => {
            const updatedData = [...prevData, newData];
            if (updatedData.length > limit) {
                updatedData.shift(); // Remove the oldest element if limit is exceeded
            }
            return updatedData;
        });
    };

    return [data, push];
};