import { ethers, waffle } from 'hardhat';
import { expect } from "chai";
import { loadFixture } from 'ethereum-waffle';
import { isAddress } from 'ethers/lib/utils';

let pancakeV3PoolDeployer_address:string;
let factoryV3_address:string;
let dummyERC20_address:string;
let dummyWeth_address:string;

describe("PoolDeployer+factoryV3+ dummyTokenErc20", function(){
  
  const createFixtureLoader = waffle.createFixtureLoader;
  

  it("Should deploy PancakeV3PoolDeployer successfully", async function deployV3poolDeployer(){
    
    const PancakeV3PoolDeployer = await ethers.getContractFactory("PancakeV3PoolDeployer");
    const pancakeV3PoolDeployer = await PancakeV3PoolDeployer.deploy();
    pancakeV3PoolDeployer_address = pancakeV3PoolDeployer.address;
    
  });

  it("should deploy FactoryV3 successfully with correct arguments and record PoolDeployerAddress into contract", async function deployFactoryV3(){
    const FactoryV3Deployer = await ethers.getContractFactory("PancakeV3Factory");
    const factoryV3Deployer = await FactoryV3Deployer.deploy(pancakeV3PoolDeployer_address);
    factoryV3_address = factoryV3Deployer.address;
    const publicVal= await factoryV3Deployer.poolDeployer();
    
    expect(publicVal, "Pool deployer address should correspond to deployed contract address").to.equal(pancakeV3PoolDeployer_address); 
  })

  it("should deploy Weth contract successfully", async function deployToken(){
    const TokenDeployer = await ethers.getContractFactory("TestERC20");
    const tokenDeployer = await TokenDeployer.deploy(10000) ;
    dummyERC20_address = tokenDeployer.address;
  })

  it("should deploy Weth contract successfully", async function deployToken(){
    const TokenDeployerWeth = await ethers.getContractFactory("TestERC20");
    const tokenDeployerWeth = await TokenDeployerWeth.deploy(1000) ;
    dummyWeth_address = tokenDeployerWeth.address;
  })

  it("should send tokens to different addresses", async function sendToken(){
    const [owner, yann, lea, paul] = await ethers.getSigners();
    const tokenWethContract = await ethers.getContractAt("TestERC20", dummyWeth_address);
    const tokenERC20Contract = await ethers.getContractAt("TestERC20", dummyERC20_address);

    await tokenWethContract.transfer(yann.address,100);
    expect(await tokenWethContract.balanceOf(yann.address)).to.equal(100);

    await tokenERC20Contract.transfer(yann.address,100);
    await tokenERC20Contract.connect(yann).transfer(lea.address,100);
    expect(await tokenERC20Contract.balanceOf(lea.address)).to.equal(100);
  })
  
  it("should create a liquidity pool", async function createLP(){
    const [owner, yann, lea, paul] = await ethers.getSigners();
    //contracts object list
    const tokenWethContract = await ethers.getContractAt("TestERC20", dummyWeth_address);
    const tokenERC20Contract = await ethers.getContractAt("TestERC20", dummyERC20_address);
    const factoryV3Contract = await ethers.getContractAt("PancakeV3Factory", factoryV3_address);
    const poolV3deployer = await ethers.getContractAt("PancakeV3PoolDeployer", pancakeV3PoolDeployer_address);
    
    //we set factory address into poolDeployer contract
    await poolV3deployer.setFactoryAddress(factoryV3_address);
    expect(await poolV3deployer.factoryAddress(), 'factory address viarbale should correspond to deployed factory').to.equal(factoryV3_address);
    const poolTransaction = await factoryV3Contract.connect(yann).createPool(dummyWeth_address, dummyERC20_address, 10000)
    const poolTransactionReceipt = await poolTransaction.wait();
    
    console.log('pool created at address: ', poolTransactionReceipt.events[0].args.pool);
 
  })
})