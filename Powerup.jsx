import React, { useEffect, useState } from 'react';
import { useStateContext } from '../contexts/ContextProvider';
import { currentUsername } from '../data/config';
import { HeaderCont2024, PageBody2024, PageWrapper2024 } from '../Styles2024';
import { Slider, SliderContainer } from './locker/LockStyles';
import { isLoggedIn } from '../data/functions/wallet_functions';
import LoadingDiv from '../components/LoadingDiv';
import { useGetAccountResources } from '../components/CustomHooks/useGetAccountResources';
import { Filler, ProgressBarContainer, ProgressBarWrapper } from './PowerupStyles';
import { estimateCpuWithElasticLimit, netCalc, predictResourceAmounts, submitPowerupTx, waxToCpuFrac, waxToNetFrac } from './powerup_functions';
import { useGetPowerupState } from '../components/CustomHooks/useGetPowerupState';
import { useGetChainInfo } from '../components/CustomHooks/useGetChainInfo';
import { BigBlueButton, FusionInputWrapper, MessageWrapper, StakeContainer } from '../FusionStyles';
import { logInWithWharfkit } from '../data/wharfkit';
import TransactionModal from '../components/TransactionModal';

const calculateResourceUsage = (current_used, max) => {
    if (max === 0) {
        return 0;
    }
    return (current_used / max) * 100;
};

 const handleInputChange = (e, setAmount, selectedToken) => {
  const value = e.target.value;
  if (value === "" || /^\d*\.?\d*$/.test(value)) {
    if (value === "" || !isNaN(value)) {
        if(value !== ""){
            if(value > Number(selectedToken.amount)){
                return;
            }
        }
        setAmount(value)
    }
  }
};

const handleSliderChange = (e, selectedToken, setAmountToLock) => {
    const percentage = e.target.value;
    const newAmountToLock = Number((selectedToken.amount * percentage) / 100).toFixed(selectedToken.decimals);
    setAmountToLock(newAmountToLock);
  };

  const handleCpuSliderChange = (e, setCpuAllocation) => {
    const percent = e.target.value;
    setCpuAllocation(percent);
  };  


const Powerup = () => {

  const {
    wharfSession,
    tokenBalances,
    balancesAreLoading,
    setWharfSession,
    setCurrentUser,
    refresh, 
    setRefresh,
    showTxModal,
    setShowTxModal,
    txModalText,
    setTxModalText,
    txIsLoading,
    setTxIsLoading       
  } = useStateContext();

  const [selectedToken, setSelectedToken] = useState({contract: "eosio.token", decimals: 8, amount: 0, currency: "WAX"});
  const [accountToBoost, setAccountToBoost] = useState(currentUsername ? currentUsername : "")
  const [cpuAllocation, setCpuAllocation] = useState(100);

  const [resources, getResources, resourcesAreLoading] = useGetAccountResources();
  const [powerupState, getPowerupState, powerupStateIsLoading] = useGetPowerupState();
  const [chainInfo, getChainInfo, chainInfoIsLoading] = useGetChainInfo();
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    getPowerupState();
    getChainInfo();
    if (isLoggedIn()) {
      getResources();
    }
  }, []);  
 
  useEffect(() => {
    if (isLoggedIn()) {
        for(const t of tokenBalances){
            if(t.currency == "WAX" && t.contract == "eosio.token"){
                setSelectedToken(t)
            }
        }
    }
  }, [tokenBalances]);    

  return (
  <div>
      {showTxModal && (
        <TransactionModal
          setShowTxModal={setShowTxModal}
          txModalText={txModalText}
          txIsLoading={txIsLoading}
        />
      )}    
                 
    <PageWrapper2024>
      <PageBody2024>
      <HeaderCont2024>
            <div>
              <h2>Powerup</h2>
              </div>

              <div>
                <h3>
                  Get CPU and NET for 24 hours
                </h3>
              </div>
            </HeaderCont2024>

            <StakeContainer>   
        <MessageWrapper>
            <p>
            Low on CPU or NET and only need a 24 hour boost? Use WAX's Powerup feature to boost your resources, without needing to stake!
            </p>
        </MessageWrapper>  

        {isLoggedIn() && balancesAreLoading && <LoadingDiv />}

        {!isLoggedIn() && <BigBlueButton
                  onClick={() => {
                    logInWithWharfkit(setCurrentUser, setWharfSession);
                  }}          
        >Please log in to proceed</BigBlueButton>}

        {isLoggedIn && !resourcesAreLoading && <ProgressBarWrapper>
                <ProgressBarContainer>
                    <Filler percentage={calculateResourceUsage(resources?.cpu_limit?.current_used, resources?.cpu_limit?.max)} style={{ width: `${Math.round(calculateResourceUsage(resources?.cpu_limit?.current_used, resources?.cpu_limit?.max))}%` }} />
                </ProgressBarContainer>   
                <p>CPU Usage: {calculateResourceUsage(resources?.cpu_limit?.current_used, resources?.cpu_limit?.max).toFixed(2)}%</p>

                <ProgressBarContainer>
                    <Filler percentage={calculateResourceUsage(resources?.net_limit?.current_used, resources?.net_limit?.max)} style={{ width: `${Math.round(calculateResourceUsage(resources?.net_limit?.current_used, resources?.net_limit?.max))}%` }} />
                </ProgressBarContainer>  
                <p>NET Usage: {calculateResourceUsage(resources?.net_limit?.current_used, resources?.net_limit?.max).toFixed(2)}%</p>                                       
            </ProgressBarWrapper>}

    <FusionInputWrapper>
        <br/>
        <h4>Account To Boost</h4>
    <input 
        value={accountToBoost}
        maxLength={12}
        onChange={(e) => {
            setAccountToBoost(e.target.value.toLowerCase())
        }}
    />          
    </FusionInputWrapper>
    
    <SliderContainer>
        <h2>WAX TO SPEND</h2>
      <Slider 
        type="range" 
        min="0" 
        max="100" 
        value={(amount / selectedToken?.amount) * 100 || ""} 
        onChange={(e) => handleSliderChange(e, selectedToken, setAmount)} 
      />
    </SliderContainer>

    <FusionInputWrapper>
    <input 
        value={amount}
        onChange={(e) => handleInputChange(e, setAmount, selectedToken)}
    />
    <h4>Max {selectedToken?.amount}</h4>            
    </FusionInputWrapper>

    <SliderContainer>
        <h2>CPU/NET RATIO</h2>
      <Slider 
        type="range" 
        min="0" 
        max="100" 
        value={cpuAllocation} 
        onChange={(e) => handleCpuSliderChange(e, setCpuAllocation)} 
      />
    </SliderContainer>
    <FusionInputWrapper>
        <h4>{100 - cpuAllocation}% NET / {cpuAllocation}% CPU</h4>
        </FusionInputWrapper>

        {!powerupStateIsLoading && !chainInfoIsLoading && (
    <MessageWrapper>
        <p>This powerup will get you approximately{" "}<b>
            {estimateCpuWithElasticLimit(waxToCpuFrac(amount, cpuAllocation, powerupState?.cpu, chainInfo), waxToNetFrac(amount, cpuAllocation, powerupState?.net, chainInfo), powerupState?.cpu, powerupState?.net, chainInfo)}</b>{" "}
            of CPU,{" and "}<b>{netCalc(Number(predictResourceAmounts(waxToCpuFrac(amount, cpuAllocation, powerupState?.cpu, chainInfo), waxToNetFrac(amount, cpuAllocation, powerupState?.net, chainInfo), powerupState?.cpu, powerupState?.net).netAmount), chainInfo)}</b>{" "}
            of NET.
            <br/><br/>
            <span style={{fontSize: "10px"}}>*These are estimates and may not be 100% accurate.</span>
        </p>
    </MessageWrapper>            
        )}


    <BigBlueButton
        disabled={selectedToken == null || amount == 0 || accountToBoost.length == 0}
        onClick={() => {
            submitPowerupTx(
                setRefresh,
                accountToBoost,
                amount,
                waxToCpuFrac(amount, cpuAllocation, powerupState?.cpu, chainInfo),
                waxToNetFrac(amount, cpuAllocation, powerupState?.net, chainInfo),
                setShowTxModal,
                setTxModalText,
                setTxIsLoading,
                wharfSession)
        }}
    >
    {(selectedToken == null || amount == 0 || accountToBoost.length == 0) ? "Enter powerup details" : "BOOST ACCOUNT FOR 24H"}
    </BigBlueButton>
        
    </StakeContainer>

      </PageBody2024>
    </PageWrapper2024>
    </div>
  )
}

export default Powerup