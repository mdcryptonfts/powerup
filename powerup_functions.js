import { ModalErrorCont, ModalSuccessCont } from "../Styles2024";
import { currentUsername, defaultSpinnerDuration, defaultTxSettings } from "../data/config";
import { PROCESSING_TX_TEXT, error_svg, success_svg } from "../data/constants";

const POWERUP_FRAC = 1_000_000_000_000_000;
const virtual_network_capacity_in_window = 172800;

export const submitPowerupTx = async (
    setRefresh,
    accountToBoost,
    maxPayment,
    cpu_frac,
    net_frac,
    setShowTxModal,
    setTxModalText,
    setTxIsLoading,
    wharfSession
  ) => {
    setShowTxModal(true);
    setTxModalText("Awaiting confirmation...");
  
      if(localStorage.getItem("wharf--session") == null){
        setTxModalText(
              "You are not logged in. Click the wallet icon in the top menu"
              );
              return;        
      }
  
      const session = wharfSession  
      
      let max_payment = `${Number(maxPayment).toFixed(8)} WAX`

  
      const action = [
        {
          account: "waxdao",
          name: "powerup",
          authorization: [session.permissionLevel],
          data: {
          },
        },        
        {
          account: "eosio",
          name: "powerup",
          authorization: [session.permissionLevel],
          data: {
            payer: currentUsername,
            receiver: accountToBoost,
            days: 1,
            net_frac: parseFloat(net_frac).toFixed(0),
            cpu_frac: parseFloat(cpu_frac).toFixed(0),
            max_payment: max_payment
          },
        },
      ];
      
      try {
        const result = await session.transact({ actions: action }, defaultTxSettings);
        setTxIsLoading(true);
        setTxModalText(PROCESSING_TX_TEXT);
        const timer = setTimeout(() => {
          setTxModalText(<span>
              <ModalSuccessCont>
              {success_svg}
              </ModalSuccessCont>
              {`${accountToBoost} has been boosted with ${max_payment}`}
            </span>)
          setRefresh((prev) => !prev)
          setTxIsLoading(false);
        }, defaultSpinnerDuration);
        return () => clearTimeout(timer);
      } catch (e) {
        console.log('ERROR: ', e);
        setTxModalText(<span>
          <ModalErrorCont>
          {error_svg}
          </ModalErrorCont>
          {e.message}        
        </span>
          );
      }   
  
  };

  //new

  export function calculateAmount(frac, state) {
    if (!frac) return 0;
    return frac * parseFloat(state.weight) / POWERUP_FRAC;
  }

  export function calcPowerupFee(state, utilizationIncrease) {
    if (utilizationIncrease <= 0) return 0;
    
    const max_price = parseFloat(state.max_price.split(' ')[0]);
    const min_price = parseFloat(state.min_price.split(' ')[0]);

    const priceIntegralDelta = (startUtilization, endUtilization) => {
        const coefficient = (max_price - min_price) / parseFloat(state.exponent);
        const startU = startUtilization / parseFloat(state.weight);
        const endU = endUtilization / parseFloat(state.weight);
        const delta = min_price * endU - min_price * startU + 
                      coefficient * (Math.pow(endU, parseFloat(state.exponent)) - Math.pow(startU, parseFloat(state.exponent)));
        return delta;
      };
      
  
    const priceFunction = (utilization) => {
      let price = min_price;
      const newExponent = state.exponent - 1.0;
      if (newExponent <= 0.0) {
        return max_price;
      } else {
        price += (max_price - min_price) * Math.pow(parseFloat(utilization) / state.weight, newExponent);
      }
      return price;
    };
  
    let fee = 0.0;
    let startUtilization = parseFloat(state.utilization);
    let endUtilization = parseFloat(startUtilization) + parseFloat(utilizationIncrease);
  
    if (startUtilization < parseFloat(state.adjusted_utilization)) {
      fee += priceFunction(parseFloat(state.adjusted_utilization)) *
             Math.min(parseFloat(utilizationIncrease), parseFloat(state.adjusted_utilization) - parseFloat(startUtilization)) / parseFloat(state.weight);
      startUtilization = parseFloat(state.adjusted_utilization);
    }
  
    if (startUtilization < endUtilization) {
      fee += priceIntegralDelta(startUtilization, endUtilization);
    }
    
    const min_fee = 0.00000001;
    const threshold = 1e-8;
    
    if (fee < threshold) {
        if (fee < min_fee) {
            return min_fee.toFixed(8);
        } else {
            return fee.toPrecision(1).replace(/e-9/, '0.00000000');
        }
    } else {
        return fee.toFixed(8);
    }
  }

  export const cpu_frac_to_submit = 100000000000;
  export const net_frac_to_submit = 2000000000;

  
 export function predictResourceAmounts(cpuFrac, netFrac, cpuState, netState) {
    const cpuAmount = calculateAmount(cpuFrac, cpuState);
    const netAmount = calculateAmount(netFrac, netState);
  
    const cpuFee = calcPowerupFee(cpuState, cpuAmount);
    const netFee = calcPowerupFee(netState, netAmount);
  
    return {
      cpuAmount,
      netAmount,
      cpuFee,
      netFee
    };
  }

  export const estimateCpuWithElasticLimit = (cpuFrac, netFrac, cpuState, netState, chainInfo) => {
    if(chainInfo && chainInfo.virtual_block_cpu_limit && chainInfo.block_cpu_limit){
        let base_limit = parseFloat(chainInfo.block_cpu_limit);
        let current_limit = parseFloat(chainInfo.virtual_block_cpu_limit);

        if(base_limit >= current_limit){
            return `${Number( ( predictResourceAmounts(cpuFrac, netFrac, cpuState, netState).cpuAmount / Math.pow(10,8) ) / 10).toFixed(2)} ms`
        }
        else{
            let multiplier = ( (100 / base_limit) * current_limit ) / 100;
            return `${Number(( ( predictResourceAmounts(cpuFrac, netFrac, cpuState, netState).cpuAmount / Math.pow(10,8) ) * multiplier) / 10).toFixed(2)} ms`
        }
    }
  }

  export const netCalc = (net_weight, chainInfo) => {
    const net_calc = (virtual_network_capacity_in_window * parseFloat(net_weight)) / parseFloat(chainInfo.total_net_weight);
    const net_calc_adjusted = net_calc * Math.pow(10,9);

    const resultInKB = net_calc_adjusted / 1024; 
    const resultInMB = resultInKB / 1024; 

    if (resultInMB >= 1) {
        return `${resultInMB.toFixed(2)} MB`;
      } else {
        return `${resultInKB.toFixed(2)} KB`;
      }
  }
  

  export function waxToCpuFrac(waxAmount, cpuAllocation, cpuState, chainInfo) {
    let cpu_frac;
    let tolerance;
    let maxIterations = 100; 

    if(waxAmount == 0 || cpuAllocation == 0) return 0;
    let waxForCpu;

    if (waxAmount <= 0.0001) {
        cpu_frac = 100; 
        tolerance = 0.000000001;
    } else {
        cpu_frac = 1000;
        tolerance = 0.0001;
    }

    for (let i = 0; i < maxIterations; i++) {
        const estimatedFee = calculateCpuFee(cpu_frac, cpuState, chainInfo);
        if (Math.abs(estimatedFee - waxAmount) < tolerance) {
            return (cpu_frac / 100) * (cpuAllocation * .999);
        }
        cpu_frac *= waxAmount / estimatedFee;
    }

    return 0;
}

export function waxToNetFrac(waxAmount, cpuAllocation, netState, chainInfo) {
    let net_frac;
    let tolerance;
    let maxIterations = 100; 

    if(waxAmount == 0 || cpuAllocation == 100) return 0;

    if (waxAmount <= 0.0001) {
        net_frac = 100; 
        tolerance = 0.000000001;
    } else {
        net_frac = 1000;
        tolerance = 0.0001;
    }

    for (let i = 0; i < maxIterations; i++) {
        const estimatedFee = calculateNetFee(net_frac, netState, chainInfo);
        if (Math.abs(estimatedFee - waxAmount) < tolerance) {
            return (net_frac / 100) * (100 - cpuAllocation) * .999;
        }
        net_frac *= waxAmount / estimatedFee;
    }

    return 0;
}

export function calculateCpuFee(cpu_frac, cpuState, chainInfo) {
    const cpuAmount = calculateAmount(cpu_frac, cpuState);
    return calcPowerupFee(cpuState, cpuAmount);
}

export function calculateNetFee(net_frac, netState, chainInfo) {
    const netAmount = calculateAmount(net_frac, netState);
    return calcPowerupFee(netState, netAmount);
}