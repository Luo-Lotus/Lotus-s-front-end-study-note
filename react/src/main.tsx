//import React from 'react'
//import ReactDOM from 'react-dom/client'
import Fiber from './Element';
import React from './react';
import ReactDOM, { useState, useEffect, useMemo } from './reactDom';
import './index.css';

const Item = ({
  text,
  onDelete,
}: {
  text: string;
  onDelete: (text: string) => void;
}) => {
  useEffect(() => {
    console.log('挂载', text);
    return () => {
      console.log('卸载', text);
    };
  }, []);
  return (
    <div
      style={{
        margin: '10px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      <div
        style={{
          fontSize: '25px',
          background: '#BD924E',
          padding: '10px',
          color: 'white',
          borderRadius: '5px',
        }}
      >
        {text}
      </div>
      <div
        onClick={() => {
          onDelete(text);
        }}
        style={{
          background: 'red',
          padding: '10px',
          color: 'white',
          borderRadius: '5px',
        }}
      >
        删除
      </div>
    </div>
  );
};

const Counter = ({ children, onClick }: any) => {
  return <div onClick={onClick}>{children}</div>;
};

const App = () => {
  const [value, setValue] = useState('');
  const [count, setCount] = useState(1);
  const [arr, setArr] = useState<string[]>([]);
  useEffect(() => {
    console.log('一直更更新');
  });
  useEffect(() => {
    console.log('count');
  }, [count]);

  

  const a = useMemo(() => count * 2, [count]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#A6B0B2',
        height: '100vh',
        width: '100vw',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <Counter
        onClick={() => {
          setCount(count + 1);
        }}
      >
        {count}-{a}
      </Counter>
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
        }}
      >
        <input
          style={{
            borderRadius: '15px',
            fontSize: '24px',
            padding: '10px',
            borderWidth: 0,
            flex: 1,
          }}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
        />
        <button
          style={{
            appearance: 'none',
            fontSize: '20px',
            marginLeft: '10px',
            padding: '10px 20px',
            cursor: 'pointer',
            borderRadius: '15px',
            border: 'none',
          }}
          onClick={() => {
            setArr(arr.concat([value]));
            setValue('');
          }}
        >
          添加
        </button>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {arr.map((item) => (
          <Item
            text={item}
            onDelete={(text) => {
              setArr(arr.filter((item) => item !== text));
            }}
            key={item}
          />
        ))}
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root') as HTMLElement);
