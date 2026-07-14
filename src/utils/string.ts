import { MyLiftElevatorActionSelector } from "@/components/Receiver/MainController/MainController"

export const parseMyLiftSelectorString = (str: string, selection: MyLiftElevatorActionSelector) => {
    let result = str;
    Object.entries(selection.options).forEach(([key, val]) => {
        result = result.replace(new RegExp(`({${key}})`), String(selection.options[key].value.current));
    });
    return result ?? "";
}