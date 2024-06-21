"use client"
import { Key, useEffect, useMemo, useState } from "react";
import { centrifugeTest } from "./centrifuge";
import { Subscription } from "centrifuge";
import { useLimitedSizeArray } from './limitedSizeArray';

export default function Home() {

  const centrifuge = centrifugeTest;
  let sub: Subscription | null;
  const [asks, pushAsk] = useLimitedSizeArray(11);
  const [bids, pushBid] = useLimitedSizeArray(11);

  const receiveNewData = (newAsks: Number[][], newBids: Number[][]) => {
    newAsks.forEach(ask => pushAsk({ price: ask[0], size: ask[1] }));
    newBids.forEach(bid => pushBid({ price: bid[0], size: bid[1] }));
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
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <div>
          BIDS
        </div>
        {bids?.map(({ price, size }: { price: Number, size: Number }, index: Key | null | undefined) => {
          return (
            <div key={index}>

              <span>Price: {price?.toString()}</span>
              <span>Size: {size?.toString()}</span>
            </div>
          )
        })}
        <div>
          <div>
            ASKS
          </div>
          {asks?.map(({ price, size }: { price: Number, size: Number }, index: Key | null | undefined) => {
            return (
              <div key={index}>

                <span>Price: {price?.toString()}</span>
                <span>Size: {size?.toString()}</span>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  );
}
