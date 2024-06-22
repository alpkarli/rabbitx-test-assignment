import { useState } from "react";

export const useLimitedSizeArray = (limit, sortOrder = 'asc', type = 'asks') => {
    const [data, setData] = useState([]);
    const [cumulativeTotal, setCumulativeTotal] = useState(0);

    const push = (newData) => {
        setData((prevData) => {
            const filteredNewData = newData.filter(item => parseFloat(item.size) !== 0);

            // Append new data to the existing data
            let updatedData = [...prevData, ...filteredNewData];

            // Splice excess items if the limit is exceeded
            if (updatedData.length > limit) {
                updatedData = updatedData.slice(updatedData.length - limit);
            }

            // Sort the data based on price first
            updatedData = updatedData.sort((a, b) => {
                const priceCompare = parseFloat(a.price) - parseFloat(b.price);
                return sortOrder === 'asc' ? priceCompare : -priceCompare;
            });

            // Recalculate cumulative total from scratch
            if (type === 'bids') {
                // Calculate cumulative total from bottom to top
                let runningTotal = 0;
                for (let i = updatedData.length - 1; i >= 0; i--) {
                    runningTotal += parseFloat(updatedData[i].size);
                    updatedData[i] = { ...updatedData[i], cumulativeTotal: runningTotal.toFixed(4) };
                }
                setCumulativeTotal(runningTotal.toFixed(4));
            } else {
                // Calculate cumulative total from top to bottom
                let runningTotal = 0;
                updatedData = updatedData.map(item => {
                    runningTotal += parseFloat(item.size);
                    return { ...item, cumulativeTotal: runningTotal.toFixed(4) };
                });
                setCumulativeTotal(runningTotal.toFixed(4));
            }

            return updatedData;
        });
    };

    return [data, push, cumulativeTotal];
};