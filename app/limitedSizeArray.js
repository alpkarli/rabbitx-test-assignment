import { useState } from "react";

export const useLimitedSizeArray = (limit) => {
    const [data, setData] = useState([]);
    const [cumulativeTotal, setCumulativeTotal] = useState(0);

    const push = (newData) => {
        setData((prevData) => {
            let cumulativeSize = prevData.reduce((total, item) => total + parseFloat(item.size), 0);
            const updatedData = [...prevData, ...newData
                .filter(item => parseFloat(item.size) !== 0)
                .map(item => {
                cumulativeSize += parseFloat(item.size);
                return { ...item, cumulativeTotal: cumulativeSize.toFixed(4) };
            })];
            if (updatedData.length > limit) {
                const excessItems = updatedData.length - limit;
                const removedItems = updatedData.splice(0, excessItems);
                const removedCumulativeSize = removedItems.reduce((total, item) => total + parseFloat(item.size), 0);
                setCumulativeTotal(prevTotal => prevTotal - removedCumulativeSize);
            }
            return updatedData;
        });
        setCumulativeTotal(prevTotal => prevTotal + newData.reduce((total, item) => total + parseFloat(item.size), 0));
    };

    return [data, push, cumulativeTotal];
};