"use client"
import { Key, useEffect, useMemo, useState } from "react";
import { centrifugeProd, centrifugeTest } from "./centrifuge";
import { Subscription } from "centrifuge";
import { useLimitedSizeArray } from './limitedSizeArray';
import { numberWithCommas } from './numberWithCommas';
import { MAXIMUM_ORDER_NUMBER } from './constants';

export default function Home() {

  const centrifuge = centrifugeProd;
  let sub: Subscription | null;
  const [asks, pushAsk] = useLimitedSizeArray(MAXIMUM_ORDER_NUMBER, 'desc', 'asks'); // Use 'asc' for ascending order
  const [bids, pushBid] = useLimitedSizeArray(MAXIMUM_ORDER_NUMBER, 'asc', 'bids'); // Use 'desc' for descending order
  const [contactPrice, setContactPrice] = useState(0);

  const receiveNewData = (newAsks, newBids) => {
    pushAsk(newAsks.map(ask => ({ price: ask[0], size: parseFloat(ask[1]).toFixed(4) })));
    pushBid(newBids.map(bid => ({ price: bid[0], size: parseFloat(bid[1]).toFixed(4) })));
  };

  useEffect(() => {
    createOrGetSubscription();
    subscription();
    configureConnection();
    return () => {
      centrifugeTest.disconnect();
      sub?.unsubscribe();
      centrifuge.removeSubscription(sub);
    }
  }, []);

  useEffect(() => {
    if (asks.length !== 0 && bids.length !== 0) {
      setContactPrice((parseFloat(asks[0]?.price) + parseFloat(bids[MAXIMUM_ORDER_NUMBER - 1]?.price)) / 2);
    }
  }, [asks, bids]);

  const createOrGetSubscription = () => {
    if (!centrifuge.getSubscription('orderbook:BTC-USD')) {
      sub = centrifuge.newSubscription("orderbook:BTC-USD");
    } else {
      sub = centrifuge.getSubscription('orderbook:BTC-USD');
    }
  }

  const configureConnection = () => {
    centrifuge.on('connecting', function (ctx) {
      console.log(`connecting: ${ctx.code}, ${ctx.reason}`);
    }).on('connected', function (ctx) {
      console.log(`connected over ${ctx.transport}`);
    }).on('disconnected', function (ctx) {
      console.log(`disconnected: ${ctx.code}, ${ctx.reason}`);
    }).connect();
  }

  const subscription = () => {
    sub?.on('publication', function (ctx) {
      receiveNewData(ctx.data.asks, ctx.data.bids);
    }).on('join', function (ctx) {
      console.log('join: ', ctx.info);
    }).on('leave', function (ctx) {
      console.log('leave: ', ctx.info);
    }).on('subscribing', function (ctx) {
      console.log(`subscribing: ${ctx.code}, ${ctx.reason}`);
    }).on('subscribed', function (ctx) {
      receiveNewData(ctx.data.asks, ctx.data.bids);
    }).on('unsubscribed', function (ctx) {
      console.log(`unsubscribed: ${ctx.code}, ${ctx.reason}`);
    }).subscribe();
  }

  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-[600px] min-h-screen flex-col items-center content-center justify-center">
        <div>
          <div className="w-[400px] mb-2">
            <div className="flex justify-between text-sm">
              <div className="w-[100px] text-left">Price <span className="text-xs rounded-xl p-1	bg-slate-800">USD</span></div>
              <div className="w-[100px] text-right">Amount <span className="text-xs rounded-xl p-1	bg-slate-800">BTC</span></div>
              <div className="w-[100px] text-right">Total <span className="text-xs rounded-xl p-1	bg-slate-800">BTC</span></div>
            </div>
          </div>
          <div className="text-red-600 w-[400px] text-sm">
            {bids?.map(({ price, size, cumulativeTotal }: { price: Number, size: Number, cumulativeTotal: Number }, index: Key | null | undefined) => {
              return (
                <div key={index} className="flex justify-between">
                  <div className="w-[100px] text-left">{numberWithCommas(price)}</div>
                  <div className="w-[100px] text-right">{size?.toString()}</div>
                  <div className="w-[100px] text-right">{cumulativeTotal?.toString()}</div>
                </div>
              )
            })}
          </div>
          <div className="w-[400px] bg-slate-800 rounded-sm">
            {contactPrice}
          </div>
          <div className="text-green-600 w-[400px] text-sm">
            {asks?.map(({ price, size, cumulativeTotal }: { price: Number, size: Number, cumulativeTotal: Number }, index: Key | null | undefined) => {
              return (
                <div key={index} className="flex justify-between">
                  <div className="w-[100px] text-left">{numberWithCommas(price)}</div>
                  <div className="w-[100px] text-right">{size?.toString()}</div>
                  <div className="w-[100px] text-right">{cumulativeTotal?.toString()}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
