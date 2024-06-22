"use client"
import { Key, useEffect, useMemo, useState } from "react";
import { centrifugeProd, centrifugeTest } from "./centrifuge";
import { Subscription } from "centrifuge";
import { useLimitedSizeArray } from './limitedSizeArray';
import { numberWithCommas } from './numberWithCommas';

export default function Home() {

  const centrifuge = centrifugeTest;
  let sub: Subscription | null;
  const [asks, pushAsk] = useLimitedSizeArray(11);
  const [bids, pushBid] = useLimitedSizeArray(11);

  const receiveNewData = (newAsks, newBids) => {
    pushAsk(newAsks.map(ask => ({ price: numberWithCommas(ask[0]), size: parseFloat(ask[1]).toFixed(4) })));
    pushBid(newBids.map(bid => ({ price: numberWithCommas(bid[0]), size: parseFloat(bid[1]).toFixed(4) })));
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
      console.log('publication: ', ctx);
      receiveNewData(ctx.data.asks, ctx.data.bids);
    }).on('join', function (ctx) {
      console.log('join: ', ctx.info);
    }).on('leave', function (ctx) {
      console.log('leave: ', ctx.info);
    }).on('subscribing', function (ctx) {
      console.log(`subscribing: ${ctx.code}, ${ctx.reason}`);
    }).on('subscribed', function (ctx) {
      receiveNewData(ctx.data.asks, ctx.data.bids);
      console.log('subscribed', ctx);
    }).on('unsubscribed', function (ctx) {
      console.log(`unsubscribed: ${ctx.code}, ${ctx.reason}`);
    }).subscribe();
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="text-red-600 w-[400px]">
        {bids?.map(({ price, size, cumulativeTotal }: { price: Number, size: Number, cumulativeTotal: Number }, index: Key | null | undefined) => {
          return (
            <div key={index} className="flex justify-between">
              <div>Price: {price?.toString()}</div>
              <div>Size: {size?.toString()}</div>
              <div>Total: {cumulativeTotal?.toString()}</div>
            </div>
          )
        })}
      </div>
      <div className="text-green-600 w-[400px]">
        {asks?.map(({ price, size, cumulativeTotal }: { price: Number, size: Number, cumulativeTotal: Number }, index: Key | null | undefined) => {
          return (
            <div key={index} className="flex justify-between">
              <div>Price: {price?.toString()}</div>
              <div>Size: {size?.toString()}</div>
              <div>Total: {cumulativeTotal?.toString()}</div>
            </div>
          )
        })}
      </div>
    </main>
  );
}
