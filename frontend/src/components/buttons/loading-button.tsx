"use client";
import {Spinner} from "~/components/ui/spinner";
import {Button, type ButtonProps} from "~/components/ui/button";
import {memo} from "react";


type Props = ButtonProps & { loading: boolean };

function LoadingButtonComponent({loading, children, ...props}: Props) {


    return (
        <Button {...props} disabled={loading || props.disabled}>
            {loading && <Spinner className="mr-2" data-icon="inline-start"/>}
            {children}
        </Button>
    )
}

export const LoadingButton = memo(LoadingButtonComponent);

export default LoadingButton;


