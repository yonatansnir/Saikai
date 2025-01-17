import styled from 'styled-components';
import {
    colorForTitle
} from '../../../helpers';


export const container = styled.div `
  display: flex;
  flex-direction:column;
  min-width: 200px;
  height: 190px;
  border:1px solid #A5ADD8;
  border-radius:8px;
  /* justify-content: space-evenly; */
  align-items: center;
  z-index:100;
  background-color:white;
  position: absolute;
   top: 1rem;
  left:0.5rem; 
  
`;
export const title = styled.div `
/* width: 81px; */
height: 21px;
padding: 3px 0px;
margin:2px 0px;
font-family: Assistant;
font-style: normal;
font-weight: bold;
font-size: 16px;
line-height: 21px;
color: #000000;
`;

export const item = styled.div `
width: 100%;
cursor: pointer;
/* padding: 2px 0px; */
/* margin: 1px 0px; */
text-align:center;
height: 18px;
font-family: Assistant;
font-style: normal;
font-weight: 300;
font-size: 14px;
line-height: 18px;
color: #000000;

&:hover {
    background-color: ${({ title }) => colorForTitle(title)};

}

`;



