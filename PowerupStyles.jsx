import styled from "styled-components";
import { theme2024 } from "../Styles2024";

export const ProgressBarContainer = styled.div`
  width: 100%;
  background-color: #e0e0de;
  border-radius: 5px;
  margin: 15px 0;
  margin-bottom: 5px;
`;

export const Filler = styled.div`
  background-color: ${props => props.percentage < 50 ? theme2024.success : 
                      props.percentage <= 85 ? theme2024.cautionOrange : 
                      theme2024.danger};
  height: 20px;
  border-radius: 5px;
  transition: width 0.5s ease-in-out;
  max-width: 100%;
`;

export const ProgressBarWrapper = styled.div`
    width: 100%;
    margin-top: 30px;

    p{
        font-size: 12px;
        font-weight: 400;
        color: ${theme2024.darkGrey};
        text-align: center;
        margin-top: 0px;
    }

    a{
        color: ${theme2024.primary};
    }
`

export const DarkBgTextBox = styled.div`
    width: 98%;
    margin-left: auto;
    margin-right: auto;
    margin-top: 15px;
    padding: 15px;
    border-radius: 10px;
    background-color: ${theme2024.secondaryDarker};

    a{
        color: ${theme2024.primary};
    }

    h2{
        color: ${theme2024.textMain};
        font-size: 18px;
    }

    p{
        padding-top: 0px;
        color: ${theme2024.textSecondary};
        font-size: 12px;
        margin-top: 0px;
    }
`