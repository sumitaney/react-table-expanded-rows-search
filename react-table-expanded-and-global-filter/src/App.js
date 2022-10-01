import React from "react";
import styled from "styled-components";
import cloneDeep from "lodash/cloneDeep";
import { useTable, useExpanded, useGlobalFilter } from "react-table";
import defaultGlobalFilter from "./helpers";

import makeData from "./makeData";

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`;

const getSubRows = (row) => row.subRows;

function Table({ columns: userColumns, data, globalFilter }) {
  const filterOptions = React.useRef({ matchedIds: [], preRows: null });

  const initialState = React.useRef({
    globalFilter
  });

  /************** ☠️☠️☠️☠️☠️☠️☠️ **************
   *********************************************
   *********************************************
   COMMENT THE USE MEMO
   1- EXPAND THE FIRST ROW
   2- WRITE THE FIRST SUB ROW NAME IN THE FILTER
   3- DELETE THE GLOBAL FILTER
   4- THE FIRST EXPANDED ROW WILL NOT RELOAD ALL THE SUB ROWS
   *********************************************
   *********************************************
   ************** ☠️☠️☠️☠️☠️☠️☠️ ***************/

  /* const tableOptions = React.useMemo(
    () => ({
      columns: userColumns,
      data,
      getSubRows: (row) => row.subRows,
      initialState: initialState.current,
      globalFilter: (rows, columnIds, filterValue) => {
        return defaultGlobalFilter(
          rows,
          columnIds,
          filterValue,
          filterOptions.current
        );
      }
    }),
    [userColumns, data]
  ); */

  const tableOptions = {
    columns: userColumns,
    data,
    getSubRows,
    /************** ✅✅✅✅✅✅✅ **************
     *********************************************
    *********************************************
    HOWEVER, WITH THIS METHOD BELOW IT WILL WORK AS EXPECTED !
    DO NOT USE IT IN PRODUCTION
    GETSUBROWS MUST BE MEMOIZED
    https://react-table.tanstack.com/docs/api/useTable#table-options
    *********************************************
    *********************************************
    ************** ✅✅✅✅✅✅✅ ***************/
    // getSubRows: (row) => row.subRows,
    initialState: initialState.current,
    globalFilter: (rows, columnIds, filterValue) =>
      defaultGlobalFilter(rows, columnIds, filterValue, filterOptions.current)
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    setGlobalFilter,
    state,
    preGlobalFilteredRows
  } = useTable(
    tableOptions,
    useGlobalFilter,
    useExpanded // Use the useExpanded plugin hook
  );

  const { expanded } = state;

  // A possible fix (part 2)
  /* React.useEffect(() => {
    filterOptions.current.preRows = cloneDeep(preGlobalFilteredRows);
  }, [preGlobalFilteredRows]); */

  React.useEffect(() => {
    filterOptions.current.matchedIds = [];
    setGlobalFilter(globalFilter);
  }, [globalFilter, setGlobalFilter]);

  return (
    <>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            if (row.canExpand) {
              return (
                <tr {...row.getRowProps()}>
                  <td
                    colSpan={row.cells.length}
                    style={{ backgroundColor: "grey" }}
                  >
                    {row.cells[0].render("Cell")}
                  </td>
                </tr>
              );
            }
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <br />
      <div>Showing the first 20 results of {rows.length} rows</div>
      <pre>
        <code>{JSON.stringify({ expanded: expanded }, null, 2)}</code>
      </pre>
    </>
  );
}

function App() {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const columns = React.useMemo(
    () => [
      {
        // Build our expander column
        id: "expander", // Make sure it has an ID
        Header: ({ getToggleAllRowsExpandedProps, isAllRowsExpanded }) => (
          <span {...getToggleAllRowsExpandedProps()}>
            {isAllRowsExpanded ? "👇" : "👉"}
          </span>
        ),
        Cell: ({ row }) =>
          // Use the row.canExpand and row.getToggleRowExpandedProps prop getter
          // to build the toggle for expanding a row
          row.canExpand ? (
            <span
              {...row.getToggleRowExpandedProps({
                style: {
                  // We can even use the row.depth property
                  // and paddingLeft to indicate the depth
                  // of the row
                  paddingLeft: `${row.depth * 1}rem`
                }
              })}
            >
              {row.isExpanded ? "👇" : "👉"} {row.original.firstName} (Level{" "}
              {row.depth})
            </span>
          ) : null
      },
      {
        Header: "Name",
        columns: [
          {
            Header: "First Name",
            accessor: "firstName"
          },
          {
            Header: "Last Name",
            accessor: "lastName"
          }
        ]
      }
    ],
    []
  );

  const data = React.useMemo(() => makeData(5, 5), []);

  const onChange = (e) => setGlobalFilter(e.target.value);

  return (
    <Styles>
      <label>Global Filter :</label>
      <input value={globalFilter} onChange={onChange} />
      <Table columns={columns} data={data} globalFilter={globalFilter} />
    </Styles>
  );
}

export default App;
