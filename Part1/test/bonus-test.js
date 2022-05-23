// [bonus] unit test for bonus.circom
const path = require("path");
const chai = require("chai");
const { ethers } = require("hardhat");
const wasm_tester = require("circom_tester").wasm;
const { unstringifyBigInts } = require("ffjavascript").utils;
const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
const buildPoseidon = require("circomlibjs").buildPoseidon;
exports.p = Scalar.fromString(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);
const Fr = new F1Field(exports.p);

const assert = chai.assert;
const should = chai.should();

describe("Pirate's Dice Test", function () {
  this.timeout(100000000);

  before(async () => {
    poseidonJs = await buildPoseidon();
  });

  it("Guess is right", async () => {
    const circuit = await wasm_tester("contracts/circuits/bonus.circom");
    await circuit.loadConstraints();
    const player1 = [2, 3, 4, 1, 2]; //5 dice values  of player 1
    const player2 = [4, 5, 6, 4, 2]; //5 dice values  of player 2
    const guess = [2, 3]; // player2 guesses 2 3's
    const salt = ethers.BigNumber.from(ethers.utils.randomBytes(32));
    const publicHash = ethers.BigNumber.from(
      poseidonJs.F.toObject(poseidonJs([salt, ...player1, ...player2]))
    );

    const INPUT = {
      player1,
      player2,
      guess,
      publicHash,
      privateSalt: salt,
    };

    const witness = await circuit.calculateWitness(INPUT, true);

    console.log(witness);

    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    assert(Fr.eq(Fr.e(witness[4]), publicHash));
  });

  it("Guess is wrong", async () => {
    const circuit = await wasm_tester("contracts/circuits/bonus.circom");
    await circuit.loadConstraints();
    const player1 = [2, 3, 2, 1, 2]; //5 dice values  of player 1
    const player2 = [4, 5, 2, 4, 2]; //5 dice values  of player 2
    const guess = [2, 3]; // player2 guesses 2 3's
    const salt = ethers.BigNumber.from(ethers.utils.randomBytes(32));
    const publicHash = ethers.BigNumber.from(
      poseidonJs.F.toObject(poseidonJs([salt, ...player1, ...player2]))
    );

    const INPUT = {
      player1,
      player2,
      guess,
      publicHash,
      privateSalt: salt,
    };

    const witness = await circuit.calculateWitness(INPUT, true);

    console.log(witness);

    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    assert(Fr.eq(Fr.e(witness[4]), publicHash));
  });

  it("Wrong input should throw error", async () => {
    const circuit = await wasm_tester(
      "contracts/circuits/MastermindVariation.circom"
    );
    await circuit.loadConstraints();
    const player1 = [2, 3, 2, 1, 2]; //5 dice values  of player 1
    const player2 = [4, 5, 2, 4, 2]; //5 dice values  of player 2
    const guess = [11, 3]; // player2 guesses 11 3's
    const salt = ethers.BigNumber.from(ethers.utils.randomBytes(32));
    const publicHash = ethers.BigNumber.from(
      poseidonJs.F.toObject(poseidonJs([salt, ...player1, ...player2]))
    );

    const INPUT = {
      player1,
      player2,
      guess,
      publicHash,
      privateSalt: salt,
    };

    try {
      const witness = await circuit.calculateWitness(INPUT, true);
      console.log(witness);
    } catch (err) {
      console.log(err.name);
      assert(err.name, "Error");
    }
  });
});
