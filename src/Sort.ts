const quickSort = (arr: any[]) => {
    const reverse = (left: number, right: number) => {
        if (left >= right) return;
        const x = arr[left];
        let lastMin = left + 1;
        for (let i = left + 1; i <= right; i += 1) {
            if (arr[i] < x) {
                const temp = arr[lastMin];
                arr[lastMin] = arr[i];
                arr[i] = temp;
                lastMin += 1;
            }
        }
        const temp = arr[lastMin - 1];
        arr[lastMin - 1] = arr[left];
        arr[left] = temp;
        reverse(left, lastMin - 2);
        reverse(lastMin, right);
    };
    reverse(0, arr.length - 1);
    return arr;
};
const arr = [7, 6, 4, 5, 6, 68, 7, 56, 49, 8, 89, 45, 15, 46];
console.log(quickSort(arr));
