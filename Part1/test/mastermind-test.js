//[assignment] write your own unit test to show that your Mastermind variation circuit is working as expectedconst chai = require("chai");
const path = require("path");
const chai = require("chai");
const { ethers } = require("hardhat");
const wasm_tester = require("circom_tester").wasm;
const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
const buildPoseidon = require("circomlibjs").buildPoseidon;
exports.p = Scalar.fromString(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);
const Fr = new F1Field(exports.p);

const assert = chai.assert;

describe("Mastermind Test", function () {
  this.timeout(100000000);

  before(async () => {
    poseidonJs = await buildPoseidon();
  });

  it("Guess is right", async () => {
    const circuit = await wasm_tester(
      "contracts/circuits/MastermindVariation.circom"
    );
    await circuit.loadConstraints();
    const guess = [15, 25, 35, 44];
    const solution = [15, 25, 35, 44];
    const salt = ethers.BigNumber.from(ethers.utils.randomBytes(32));
    const solutionHash = ethers.BigNumber.from(
      poseidonJs.F.toObject(poseidonJs([salt, ...solution]))
    );

    const INPUT = {
      pubGuessA: guess[0],
      pubGuessB: guess[1],
      pubGuessC: guess[2],
      pubGuessD: guess[3],
      pubNumBlacks: "4",
      pubNumWhites: "0",
      pubSolnHash: solutionHash,
      privSolnA: solution[0],
      privSolnB: solution[1],
      privSolnC: solution[2],
      privSolnD: solution[3],
      privSaltedSoln: salt,
    };

    const witness = await circuit.calculateWitness(INPUT, true);

    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    assert(Fr.eq(Fr.e(witness[1]), solutionHash));
  });

  it("Guess is partially wrong", async () => {
    const circuit = await wasm_tester(
      "contracts/circuits/MastermindVariation.circom"
    );
    await circuit.loadConstraints();
    const guess = [11, 13, 12, 14];

    const solution = [11, 12, 13, 14];
    const salt = ethers.BigNumber.from(ethers.utils.randomBytes(32));
    const solutionHash = ethers.BigNumber.from(
      poseidonJs.F.toObject(poseidonJs([salt, ...solution]))
    );

    const INPUT = {
      pubGuessA: guess[0],
      pubGuessB: guess[1],
      pubGuessC: guess[2],
      pubGuessD: guess[3],
      pubNumBlacks: "2",
      pubNumWhites: "2",
      pubSolnHash: solutionHash,
      privSolnA: solution[0],
      privSolnB: solution[1],
      privSolnC: solution[2],
      privSolnD: solution[3],
      privSaltedSoln: salt,
    };

    const witness = await circuit.calculateWitness(INPUT, true);

    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    assert(Fr.eq(Fr.e(witness[1]), solutionHash));
  });

  it("Wrong input should throw error", async () => {
    const circuit = await wasm_tester(
      "contracts/circuits/MastermindVariation.circom"
    );
    await circuit.loadConstraints();
    const guess = [10, 23, 33, 44];
    const solution = [10, 23, 33, 44];
    const salt = ethers.BigNumber.from(ethers.utils.randomBytes(32));
    const solutionHash = ethers.BigNumber.from(
      poseidonJs.F.toObject(poseidonJs([salt, ...solution]))
    );

    const INPUT = {
      pubGuessA: guess[0], //out of input range
      pubGuessB: guess[1],
      pubGuessC: guess[2],
      pubGuessD: guess[3],
      pubNumBlacks: "0",
      pubNumWhites: "0",
      pubSolnHash: solutionHash,
      privSolnA: solution[0],
      privSolnB: solution[1],
      privSolnC: solution[2],
      privSolnD: solution[3],
      privSaltedSoln: salt,
    };
    try {
      const witness = await circuit.calculateWitness(INPUT, true);
    } catch (err) {
      assert(err.name, "Error");
    }
  });
});
