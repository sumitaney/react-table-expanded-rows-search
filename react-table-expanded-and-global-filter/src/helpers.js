const defaultGlobalFilter = (rows, columnIds, filterValue, options) => {
  console.log("options", options);
  // Do not filter
  if (filterValue === "" || filterValue === null || filterValue === undefined) {
    return rows;
  }

  // In case of a complex filter, the parent component should provide the filter logic
  if (typeof filterValue !== "string") {
    return [];
  }
  const textSearchValues = filterValue.trim().toLocaleLowerCase();
  const arraySearchValues = textSearchValues.split(" "); // Transform it to array of separate words

  return rows.filter((row) => {
    const { values, original } = row;

    // NOTE: To force display the row always even after a globalFilter
    // Add skipFilter: false to the original row data
    const skipFilter = original.skipFilter === true;

    // The default filter will consider only the basic data format like number and string
    // The parent component should provide the filter method if the data are complex (like Arrays and Objects)
    // Or the column structure contains customized cells. (See the cell property of react table columns)
    // The line below will use only the considered columns ids (see disableGlobalFilter in the column definition)
    // It will filter the value of the displayed row object
    // Then add all the elements to a string separated by space
    // And an array of separate lowercase words without empty strings
    const textValues = columnIds
      .map((col) => values && values[col])
      .filter((v) => ["string", "number"].includes(typeof v))
      .join(" ")
      .split(" ") // Delete extra spaces between words
      .filter((v) => v !== "")
      .join(" ")
      .toLocaleLowerCase();

    // Return whether the filter values exist in the columns or not
    // This method in the line below will do the same, however repeating the same word multiple times will meet always the condition
    const exist = arraySearchValues.every((str) => textValues.includes(str));

    // If this row data matches the filter then preserve the id
    // We will use that id to display the children even if theirs data do not matches the filter
    // And to expand the parent rows as well after a filter
    if (
      exist &&
      options &&
      Array.isArray(options.matchedIds) &&
      !options.matchedIds.includes(row.id)
    ) {
      options.matchedIds.push(row.id);
    }

    // If the id exists in options then the parent was filtered
    // And we want to display the children as well
    // Keep this check after pushing the id to matchedIds
    // When the parent and a leaf match the filter we want to push both ids
    // So the component later will open all the Parents of that leaf
    if (
      options &&
      Array.isArray(options.matchedIds) &&
      options.matchedIds.some((fid) => row.id.startsWith(`${fid}.`))
    ) {
      return true;
    }

    // Do not lift skipFilter up
    // We want to test if this row matches the filter first
    // In that case we may display all its children (subRows) as well
    return (
      exist ||
      skipFilter ||
      (Array.isArray(row.subRows) &&
        !!defaultGlobalFilter(row.subRows, columnIds, filterValue).length)
    );
  });
};

export default defaultGlobalFilter;
