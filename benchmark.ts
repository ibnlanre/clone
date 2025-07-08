"use strict";

import cloneDeep from "clone-deep";
import deepCopy from "deep-copy";
import fastCopy from "fast-copy";
import bench from "fastbench";
import lodashCloneDeep from "lodash.clonedeep";
import nanoCopy from "nano-copy";
import nanoClone from "nanoclone";
import plainObjectClone from "plain-object-clone";
import rfdc from "rfdc";

import fixture from "./fixture.json";
import clone from "./index";

import { copy as fastestJsonCopy } from "fastest-json-copy";
import { klona } from "klona";

const rfdcDefaults = rfdc();
const rfdcProto = rfdc({ proto: true });
const rfdcCircles = rfdc({ circles: true });
const rfdcCirclesProto = rfdc({ circles: true, proto: true });

const max = 1000;
const run = bench(
  [
    function benchDeepCopy(callback) {
      for (let i = 0; i < max; i++) {
        deepCopy(fixture);
      }
      setImmediate(callback);
    },
    function benchLodashCloneDeep(callback) {
      for (let i = 0; i < max; i++) {
        lodashCloneDeep(fixture);
      }
      setImmediate(callback);
    },
    function benchCloneDeep(callback) {
      for (let i = 0; i < max; i++) {
        cloneDeep(fixture);
      }
      setImmediate(callback);
    },
    function benchFastCopy(callback) {
      for (let i = 0; i < max; i++) {
        fastCopy(fixture);
      }
      setImmediate(callback);
    },
    function benchFastestJsonCopy(callback) {
      for (let i = 0; i < max; i++) {
        fastestJsonCopy(fixture);
      }
      setImmediate(callback);
    },
    function benchNanoClone(callback) {
      for (let i = 0; i < max; i++) {
        nanoClone(fixture);
      }
      setImmediate(callback);
    },
    function benchPlainObjectClone(callback) {
      for (let i = 0; i < max; i++) {
        plainObjectClone(fixture);
      }
      setImmediate(callback);
    },
    function benchNanoCopy(callback) {
      for (let i = 0; i < max; i++) {
        nanoCopy(fixture);
      }
      setImmediate(callback);
    },
    function benchKlona(callback) {
      for (let i = 0; i < max; i++) {
        klona(fixture);
      }
      setImmediate(callback);
    },
    function benchRfdc(callback) {
      for (let i = 0; i < max; i++) {
        rfdcDefaults(fixture);
      }
      setImmediate(callback);
    },
    function benchRfdcProto(callback) {
      for (let i = 0; i < max; i++) {
        rfdcProto(fixture);
      }
      setImmediate(callback);
    },
    function benchRfdcCircles(callback) {
      for (let i = 0; i < max; i++) {
        rfdcCircles(fixture);
      }
      setImmediate(callback);
    },
    function benchRfdcCirclesProto(callback) {
      for (let i = 0; i < max; i++) {
        rfdcCirclesProto(fixture);
      }
      setImmediate(callback);
    },
    function benchClone(callback) {
      for (let i = 0; i < max; i++) {
        clone(fixture);
      }
      setImmediate(callback);
    },
  ],
  100
);

run(run);
