declare module 'react-csv' {
  import * as React from "react";

  export interface CSVDownloadProps {
    data: any[];
    filename?: string;
    onComplete?: () => void;
    target?: string;
    uFEFF?: boolean;
    headers?: { label: string, key: string }[];
    enclosingCharacter?: string;
    separator?: string;
  }

  export class CSVDownload extends React.Component<CSVDownloadProps, any> {}
  export class CSVLink extends React.Component<CSVDownloadProps, any> {}
}

declare module 'xlsx-js-style' {
  export const utils: any;
  export const writeFile: any;
}