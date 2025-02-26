import React from "react";
import { useInitial } from "./useInitial";

/**
 * The ComponentPreviews component
 */
const ComponentPreviews = React.lazy(() => import("./previews"));

export { ComponentPreviews, useInitial };
